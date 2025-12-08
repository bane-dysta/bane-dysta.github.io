#include <Origin.h>
#include <../OriginLab/DialogEx.h>
#include <../OriginLab/HTMLDlg.h>
#include <../OriginLab/GraphPageControl.h>
#include <../OriginLab/OriginEvents.h>
#include <event_utils.h>
#include <xfutils.h>
#include <../OriginLab/fft.h>
#include <ojsu.h> // Needed for json_escape_str_token()

#pragma labtalk(0)

#define ID_GRAPH_CONTROL 1

class OC_REGISTERED PiecewiseSmoothDlgROICtrlEvents : public OriginEventsBase
{
public:
	virtual bool OnContextMenu(int x, int y, DWORD dwControl = 0)
	{
		return true;
	}

	virtual	bool SetObj(OriginObject& obj)
	{
		m_go = obj;
		return m_go.IsValid();
	}
protected:
	GraphObject m_go;
};

struct stPiecewiseSmoothSettings
{
	int method; // Zero-based: 0=AA, 1=SG, 2=Percentile, 3=FFT (for localization).
	bool weight;
	int polyorder; // Zero-based: 0=1st, 1=2nd, 2=3rd (for localization).
	double percent;
	int npts; // If method==1, then minimum is 3 else 2. Must an intregral value.
	int boundary; // Zero-based: based on enum {EDGEPAD_NONE, EDGEPAD_REFLECT, EDGEPAD_REPEAT, EDGEPAD_PERIODIC, EDGEPAD_EXTRAPOLATE, EDGEPAD_ZERO};
	int maxpoints;

	void InitDefault()
	{
		method = 1;
		weight = false;
		polyorder = 1;
		percent = 50;
		npts = 20;
		boundary = 0;
		maxpoints = 10;
	}
};

enum {
	PIECEWISE_SMOOTH_DATA_UNKNOWN_ERR = -99,
	PIECEWISE_SMOOTH_DATA_NOT_MONOTONIC = -3,
	PIECEWISE_SMOOTH_DATA_NOT_EVENLY_SPACED = -2,
	PIECEWISE_SMOOTH_DATA_TOO_FEW_POINTS = -1,
	PIECEWISE_SMOOTH_DATA_INVALID = 0,
	PIECEWISE_SMOOTH_DATA_OK = 1,
};


// Begin potential localized strings.
#define STR_PIECEWISE_SMOOTH_DLG_TITLE		"Piecewise Smooth" //_L("Piecewise Smooth")
#define STR_PIECEWISE_SMOOTH_PLOT			"Plot" //_L("Plot")
#define STR_PIECEWISE_SMOOTH_AUTOX			"<autoX>" //_L("<autoX>")
#define STR_PIECEWISE_SMOOTH_INPUT_DATA		"Input Data" //_L("Input Data")
#define STR_PIECEWISE_SMOOTH_APPL_SMOOTH	"Applicable Smoothing" //_L("Applicable Smoothing")
#define STR_PIECEWISE_SMOOTH_SMOOTH_DATA	"Smoothed Data" //_L("Smoothed Data")
#define STR_PIECEWISE_SMOOTH_INPUT_XY		"Input XY" //_L("Input XY")
#define STR_PIECEWISE_SMOOTH_NEW_COL		"New Column" //_L("New Column")
#define STR_PIECEWISE_SMOOTH_NEW_XY			"New XY" //_L("New XY")
#define STR_PIECEWISE_SMOOTH_NEW_SHEET		"New Sheet" //_L("New Sheet")
#define STR_PIECEWISE_SMOOTH_NEWBOOK		"New Book" //_L("New Book")
// End potential localized strings.


#define STR_PIECEWISE_SMOOTH_LEGEND			"\l(1.1) " + STR_PIECEWISE_SMOOTH_INPUT_DATA + "     \l(1.2)" + STR_PIECEWISE_SMOOTH_APPL_SMOOTH + "     \l(2.1)" + STR_PIECEWISE_SMOOTH_SMOOTH_DATA

#define PIECEWISE_SMOOTH_ROI_COLOR			okutil_HTML_to_ocolor("#FFFF80") // Lt Yellow
#define PIECEWISE_SMOOTH_INPUT_PLOT_COLOR	okutil_HTML_to_ocolor("#000000") // Black
#define PIECEWISE_SMOOTH_OUTPUT_PLOT_COLOR	okutil_HTML_to_ocolor("#0000FF") // Blue
#define PIECEWISE_SMOOTH_ROI_PLOT_COLOR		okutil_HTML_to_ocolor("#FF0000") // Red
#define PIECEWISE_SMOOTH_LINE_WIDTH			1

#define	PIECEWISE_SMOOTH_MIN_TOTAL_POINTS	6

class PiecewiseSmoothDlg;
static PiecewiseSmoothDlg *s_pPiecewiseSmoothDlg = NULL;

class PiecewiseSmoothDlg:public HTMLDlg
{
public:
	PiecewiseSmoothDlg()
	{
		// Make sure @BDPI is turned on. We will revert it in destructor.
		// For some reason, this HAS to be done even in 9.5 for the DPI to be correct.
		okutil_sys_values("BDPI", &m_PrevAtBDPI);
		double dAtBDPI = 1;
		okutil_sys_values("BDPI", &dAtBDPI, false);

		m_stSettings.InitDefault();

		m_strInitSelRange = GetSelectedXYRange();
		m_strRangeListAsJSON = GetXYRangeListAsJSON(Project.ActiveLayer());

		m_bHasInputData = false;

		WorksheetPage wksp;
		wksp.Create("Origin", CREATE_HIDDEN | CREATE_NO_GUI_ACCESS);
		if( wksp.Layers.Count() < 1 )
			wksp.AddLayer();

		m_wksTemp = wksp.Layers(0);
		m_wksTemp.SetSize(-1, 6);
		m_wksTemp.SetColDesignations("XYXY");

		string strFile = __FILE__;
		m_gp.Create(GetFilePath(strFile) + "PiecewiseSmooth.otp", CREATE_HIDDEN | CREATE_NO_GUI_ACCESS );
		if( m_gp.Layers.Count() < 1 )
			m_gp.AddLayer();

		GraphLayer gl_0;
		gl_0 = m_gp.Layers(0);

		GraphObject goLegend = gl_0.GraphObjects("Legend");
		goLegend.Text = STR_PIECEWISE_SMOOTH_LEGEND;

		m_goROI = gl_0.GraphObjects("RECT_ROI");

		// Prevent right-click and double-click on ROI.
		m_goROI.SetEventHandler("PiecewiseSmoothDlgROICtrlEvents");
		m_goROI.SetDBClick(false);

		Tree tr;
		tr.Root.Fill.Color.nVal = PIECEWISE_SMOOTH_ROI_COLOR;

		string strFunc = "PiecewiseSmoothDlgUserMoveROI();";
		string strLT;
		strLT.Format("{if(%d==%%1||%d==%%1){%s}}", OE_MOVE, OE_RESIZE, strFunc);
		tr.Root.Script.strVal = strLT;
		int nErr = m_goROI.UpdateThemeIDs(tr.Root);
		if (0 == nErr)
			m_goROI.ApplyFormat(tr, false, true);

		ChangeScriptRunAfter(m_goROI, GRCT_ANY_EVENT);
	}

	~PiecewiseSmoothDlg()
	{
		okutil_sys_values("BDPI", &m_PrevAtBDPI, false);

		/// Kenny 08/22/2017 QA-2782-P3 HTML_APP_PIECEWISE_SMOOTH_CRASH
		//if( m_gp.IsValid() )
		//	m_gp.Destroy();
		//
		//if( m_wksTemp.IsValid() )
		//{
		//	WorksheetPage wksp = m_wksTemp.GetPage();
		//	wksp.Destroy();
		//}
		/// End HTML_APP_PIECEWISE_SMOOTH_CRASH
	}

	/*
	 * Returns one of:
	 * enum {
	 * 	PIECEWISE_SMOOTH_DATA_UNKNOWN_ERR = -99,
	 *	PIECEWISE_SMOOTH_DATA_NOT_MONOTONIC = -3,
	 * 	PIECEWISE_SMOOTH_DATA_NOT_EVENLY_SPACED = -2,
	 * 	PIECEWISE_SMOOTH_DATA_TOO_FEW_POINTS = -1,
	 * 	PIECEWISE_SMOOTH_DATA_INVALID = 0,
	 * 	PIECEWISE_SMOOTH_DATA_OK = 1,
	 * };
	*/
	int LoadInputData(string strRange, int nValid)
	{
		waitCursor junk;

		if( Selection.IsSelected(m_goROI) )
			Selection.Remove(m_goROI);

		m_gcCntrl.Visible = false;

		if( m_bHasInputData )
		{
			// Can't just change one plot easily with arbitrary XYRange.
			// Easier just to delete all plots and add back later.
			foreach( GraphLayer gl in m_gp.Layers )
			{
				int nCount = gl.DataPlots.Count();
				for( int ii = nCount - 1; ii >= 0; ii-- )
				{
					gl.RemovePlot(gl.DataPlots(ii));
				}
			}

			vector vec;
			vec.SetSize(0);
			m_xyrWorking.SetData(&vec, &vec, 0, NULL, 0);
			m_xyrSmoothed.SetData(&vec, &vec, 0, NULL, 0);
			m_xyrROI.SetData(&vec, &vec, 0, NULL, 0);

			m_stSettings.InitDefault();

			m_bHasInputData = false;
		}

		XYRange xyr;
		if( strRange.GetLength() > 0 && nValid && okxf_init_range_from_string(&m_xyrInput, strRange) )
		{
			vector vWorkingX, vWorkingY;

			// Skips missing and masked.
			m_xyrInput.GetData(vWorkingY, vWorkingX, NULL, 0, DRR_GET_DEPENDENT);

			int nSize = vWorkingY.GetSize();
			if( nSize < PIECEWISE_SMOOTH_MIN_TOTAL_POINTS )
				return PIECEWISE_SMOOTH_DATA_TOO_FEW_POINTS;

			//int nMono = ocmath_is_monotonic(vWorkingX, vWorkingX.GetSize(), true);
			int nMono = ocmath_is_monotonic(vWorkingX, vWorkingX.GetSize(), false); // Allow for duplicate X next to each other.
			if( MONO_INCREASE != nMono && MONO_DECREASE != nMono )
				return PIECEWISE_SMOOTH_DATA_NOT_MONOTONIC;
				
			double dInterval;
			bool bEvenInt = (OE_NOERROR == ocmath_sampling_resolution(vWorkingX.GetSize(), vWorkingX, &dInterval));

			m_bHasInputData = true;

			m_xyrWorking.BreakUp();
			m_xyrWorking.Add(m_wksTemp, 0, "X");
			m_xyrWorking.Add(m_wksTemp, 1, "Y");
			m_xyrWorking.SetData(&vWorkingY, &vWorkingX, 0, NULL, 0);

			m_xyrSmoothed.BreakUp();
			m_xyrSmoothed.Add(m_wksTemp, 2, "X");
			m_xyrSmoothed.Add(m_wksTemp, 3, "Y");
			m_xyrSmoothed.SetData(&vWorkingY, &vWorkingX, 0, NULL, 0);

			m_xyrROI.BreakUp();
			m_xyrROI.Add(m_wksTemp, 4, "X");
			m_xyrROI.Add(m_wksTemp, 5, "Y");

			GraphLayer gl_0;
			gl_0 = m_gp.Layers(0);
			gl_0.AddPlot(m_xyrInput, IDM_PLOT_LINE);
			gl_0.AddPlot(m_xyrROI, IDM_PLOT_LINE);

			GraphLayer gl_1;
			gl_1 = m_gp.Layers(1);
			gl_1.AddPlot(m_xyrSmoothed, IDM_PLOT_LINE);

			DataPlot dpInput, dpROI, dpOutput;
			dpInput = gl_0.DataPlots(0);
			dpROI = gl_0.DataPlots(1);
			dpOutput = gl_1.DataPlots(0);

			Tree trPlot;
			trPlot.Root.Line.Width.nVal = PIECEWISE_SMOOTH_LINE_WIDTH;
			trPlot.Root.Line.Color.nVal = PIECEWISE_SMOOTH_INPUT_PLOT_COLOR;
			int nErr = dpInput.UpdateThemeIDs(trPlot.Root);
			if (0 == nErr)
				dpInput.ApplyFormat(trPlot, false, true);

			trPlot.Root.Line.Width.nVal = PIECEWISE_SMOOTH_LINE_WIDTH;
			trPlot.Root.Line.Color.nVal = PIECEWISE_SMOOTH_ROI_PLOT_COLOR;
			nErr = dpROI.UpdateThemeIDs(trPlot.Root);
			if (0 == nErr)
				dpROI.ApplyFormat(trPlot, false, true);

			trPlot.Root.Line.Width.nVal = PIECEWISE_SMOOTH_LINE_WIDTH;
			trPlot.Root.Line.Color.nVal = PIECEWISE_SMOOTH_OUTPUT_PLOT_COLOR;
			nErr = dpOutput.UpdateThemeIDs(trPlot.Root);
			if (0 == nErr)
				dpOutput.ApplyFormat(trPlot, false, true);

			gl_0.Rescale();

			ChangeScriptRunAfter(m_goROI, GRCT_NONE);

			double dInitLeft = vWorkingX[vWorkingX.GetSize() * 0.3];
			double dInitRight = vWorkingX[vWorkingX.GetSize() * 0.7];

			Tree trROI;
			trROI.Root.Dimension.Attachment.nVal = 2; // Layer and Scale
			trROI.Root.Dimension.Units.nVal = UNITS_SCALE;
			trROI.Root.Dimension.Left.dVal = dInitLeft;
			trROI.Root.Dimension.Width.dVal = dInitRight - dInitLeft;
			nErr = m_goROI.UpdateThemeIDs(trROI.Root);
			if (0 == nErr)
				m_goROI.ApplyFormat(trROI, false, true);

			double dValidLeft, dValidRight;
			int nLeftIdx, nRightIdx;

			// Adjust ROI to valid position and number of points prior to smoothing.
			if( PIECEWISE_SMOOTH_DATA_OK == SetROIValidPosition(m_goROI, vWorkingX, vWorkingY, dValidLeft, dValidRight, &nLeftIdx, &nRightIdx) )
			{
				m_nSmoothingIdx1 = nLeftIdx;
				m_nSmoothingIdx2 = nRightIdx;

				SmoothROI();

				// Have to update HTML controls after smoothing because some settings may have been adjusted during smoothing.
				ChangeSettingsControlsFromOC();
			}

			ChangeScriptRunAfter(m_goROI, GRCT_ANY_EVENT);

			m_gcCntrl.Visible = true;

			if( !bEvenInt )
				return PIECEWISE_SMOOTH_DATA_NOT_EVENLY_SPACED;

			return PIECEWISE_SMOOTH_DATA_OK;
		}

		return PIECEWISE_SMOOTH_DATA_INVALID;
	}

	string GetSettings()
	{
		string strJSON;
		JSON.ToString(m_stSettings, strJSON);
		return strJSON;
	}

	void SettingsControlsChanged(string strJSON)
	{
		JSON.FromString(m_stSettings, strJSON);
		if( !m_bHasInputData || m_nSmoothingIdx2 == m_nSmoothingIdx1 )
			return;

		SmoothROI();

		// Have to update HTML controls after smoothing because some settings may have been adjusted during smoothing.
		// But not here because settings should be correct from HTML controls.
		ChangeSettingsControlsFromOC();
	}

	void MoveROI()
	{
		if( Selection.IsSelected(m_goROI) )
			Selection.Remove(m_goROI);

		waitCursor junk;

		if( !m_bHasInputData )
			return;

		vector vWorkingY, vWorkingX;
		m_xyrWorking.GetData(vWorkingY, vWorkingX, NULL, 0, DRR_GET_DEPENDENT);

		double dLeft, dRight;
		int nLeftIdx, nRightIdx;

		// Adjust ROI to valid position and number of points prior to smoothing.
		if( PIECEWISE_SMOOTH_DATA_OK == SetROIValidPosition(m_goROI, vWorkingX, vWorkingY, dLeft, dRight, &nLeftIdx, &nRightIdx) )
		{
			m_nSmoothingIdx1 = nLeftIdx;
			m_nSmoothingIdx2 = nRightIdx;

			SmoothROI();

			// Have to update HTML controls after smoothing because some settings may have been adjusted during smoothing.
			ChangeSettingsControlsFromOC();
		}
	}

	int SmoothROIClick(string strJSON)
	{
		int nRet = 0;

		JSON.FromString(m_stSettings, strJSON);
		if( !m_bHasInputData || m_nSmoothingIdx2 == m_nSmoothingIdx1 )
			return nRet;

		if( SmoothROI() )
		{
			vector vec;
			//vec.SetSize(0);

			vector vROIX, vROIY;
			m_xyrROI.GetData(vROIY, vROIX, NULL, 0, DRR_GET_DEPENDENT);

			vector vSmoothedX, vSmoothedY;
			m_xyrSmoothed.GetData(vSmoothedY, vSmoothedX, NULL, 0, DRR_GET_DEPENDENT);
			m_xyrSmoothed.SetData(&vec, &vec, 0, NULL, 0);

			//int nLength = abs(m_nSmoothingIdx2 - m_nSmoothingIdx1);
			int nLength = abs(m_nSmoothingIdx2 - m_nSmoothingIdx1) + 1;

			vSmoothedY.SetSubVector(vROIY, m_nSmoothingIdx1, nLength);
			m_xyrSmoothed.SetData(&vSmoothedY, &vSmoothedX, 0, NULL, 0);

			nRet = 1;
		}

		// Have to update HTML controls after smoothing because some settings may have been adjusted during smoothing.
		ChangeSettingsControlsFromOC();

		return nRet;
	}

	void OkClick(string strRange)
	{
		if( !m_xyrInput.IsValid() || !m_xyrSmoothed.IsValid() )
		{
			Close();
			return;
		}

		waitCursor junk;

		Column colInputY, colInputX;
		int nRow1, nRow2;
		m_xyrInput.GetYColumn(colInputY, 0, &nRow1, &nRow2);
		m_xyrInput.GetXColumn(colInputX, 0);

		WorksheetPage wkspInput;
		Worksheet wksInput;

		// Loose dataset fix.
		// If input Y is invalid, it comes from loose dataset such as OGG.
		// Then output to new book by changing range.
		if( !colInputY.IsValid() )
			strRange = "[<new>]<new>!(<new>,<new>)";
		else
		{
			colInputY.GetParent(wksInput);
			wkspInput = wksInput.GetPage();
		}

		WorksheetPage wkspOutput;
		Worksheet wksOutput;
		Column colOutputY, colOutputX;

		//if( 0 == strRange.CompareNoCase("(<input>,<input>)") )
		//{
		//}
		//else if( 0 == strRange.CompareNoCase("(<input>,<new>)") )
		if( 0 == strRange.CompareNoCase("(<input>,<new>)") )
		{
			wkspOutput = wkspInput;
			wksOutput = wksInput;
			colOutputY = wksOutput.Columns(wksOutput.AddCol());
		}
		else if( 0 == strRange.CompareNoCase("(<new>,<new>)") )
		{
			wkspOutput = wkspInput;
			wksOutput = wksInput;
			colOutputX = wksOutput.Columns(wksOutput.AddCol());
			colOutputY = wksOutput.Columns(wksOutput.AddCol());
		}
		else if( 0 == strRange.CompareNoCase("<new>!(<new>,<new>)") )
		{
			wkspOutput = wkspInput;
			int nLayer = wkspOutput.AddLayer();
			wksOutput = wkspOutput.Layers(nLayer);
			colOutputX = wksOutput.Columns(0);
			colOutputY = wksOutput.Columns(1);
		}
		else if( 0 == strRange.CompareNoCase("[<new>]<new>!(<new>,<new>)") )
		{
			wkspOutput.Create("Origin", CREATE_HIDDEN);
			wksOutput = wkspOutput.Layers(0);
			colOutputX = wksOutput.Columns(0);
			colOutputY = wksOutput.Columns(1);
		}
		else
		{
			Close();
			return;
		}

		string strColName;
		string strUnits;
		string strDescription;

		// Loose dataset fix.
		if( colInputY.IsValid())
		{
			strColName = colInputY.GetLongName();
			if( strColName.IsEmpty() )
				strColName = colInputY.GetName();

			strUnits = colInputY.GetUnits();
			strDescription = m_xyrInput.GetDescription(GETLC_COL_LN_ONLY);
		}
		else // Loose dataset such as OGG.
		{
			string strY;
			m_xyrInput.GetDatasetNames(strY);
			DatasetObject ds(strY);
			ds.GetLabel(strColName, RCLT_LONG_NAME, false);
			if( strColName.IsEmpty() )
				strColName = strY.GetToken(1, '_');

			strDescription = strY;
		}

		colOutputY.SetType(OKDATAOBJ_DESIGNATION_Y);
		colOutputY.SetLongName("Smoothed " + strColName);
		colOutputY.SetUnits(strUnits);

		string strComments;
		strComments.Format("Piecewise Smooth of %s", strDescription);
		colOutputY.SetComments(strComments);

		if( colOutputX.IsValid())
		{
			colOutputX.SetType(OKDATAOBJ_DESIGNATION_X);

			if( colInputX.IsValid() )
			{
				string strName = colInputX.GetLongName();
				if ( strName.IsEmpty() )
					strName = colInputX.GetName();

				colOutputX.SetLongName("Smoothed " + strName);
				colOutputX.SetUnits(colInputX.GetUnits());

				int nFormat = colInputX.GetFormat();
				if( OKCOLTYPE_TEXT_NUMERIC != nFormat || OKCOLTYPE_NUMERIC != nFormat )
				{
					colOutputX.SetFormat(nFormat);
					colOutputX.SetSubFormat(colInputX.GetSubFormat());

				}
			}
		}

		XYRange xyrOutput;
		if( colOutputX.IsValid())
		{
			xyrOutput.Add(wksOutput, colOutputX.GetIndex(), "X");
			xyrOutput.Add(wksOutput, colOutputY.GetIndex(), "Y");
		}
		else if( colInputX.IsValid() )
		{
				xyrOutput.Add("X", wksInput, nRow1, colInputX.GetIndex(), nRow2, colInputX.GetIndex());
				xyrOutput.Add("Y", wksOutput, nRow1, colOutputY.GetIndex(), nRow2, colOutputY.GetIndex());
		}
		else
		{
			xyrOutput.Add(wksOutput, colOutputY.GetIndex(), "Y");
		}

		if( xyrOutput.IsValid() )
		{
			vector vInputX, vInputY;
			vector<int> vnMissingValsIndices;
			m_xyrInput.GetData(vInputY, vInputX, NULL, 0, DRR_GET_DEPENDENT, &vnMissingValsIndices);

			vector vSmoothedX, vSmoothedY;
			m_xyrSmoothed.GetData(vSmoothedY, vSmoothedX, NULL, 0, DRR_GET_DEPENDENT);

			set_xyrange_data_ex(xyrOutput, &vSmoothedY, &vInputX, 0, m_xyrInput, &vnMissingValsIndices);

			// BUG!!!
			// Under certain stuations, the newly added column will not show unless
			// worksheet is redrawn.
			wkspOutput.SetShow(PAGE_ACTIVATE);
			string strLT;
			strLT.Format("page.active=%d;", wksOutput.GetIndex()+1);
			wkspOutput.LT_execute(strLT);
			//wkspOutput.Refresh();
		}

		Close();
	}

	void CancelClick()
	{
		Close();
	}

	/*
	 * Javascript-callable class function required to route requests
	 * from o-range control.
	 *
	 * Parameters:
	 * 	strORangeControlId:	The id attribute for the o-range control.
	 *	nRequest:			One of the ORANGECONTROL_ enums.
	 *							To be used for routing.
	 * 	strRange:			The current range string in the o-range control.
	 *
	 * Returns:	string.
	 *
	 *
	 * About each request type:
	 *
	 *	ORANGECONTROL_GET_RANGE is a request to return an arbitrary range string.
	 *		It is currently used to initialize an o-range control when it is created.
	 *		Not only can a valid range string be returned, an empty string or even
	 *		"_INVALID_" can be returned if desired.
	 *
	 *	ORANGECONTROL_GET_FLYOUT is a request to return a JSON-compliant string of
	 *		key-value pair to be used for the flyout menu. Then menu text is the key
	 *		and the value if the range string that populates the control when the menu
	 *		item is clicked. An example key-value JSON string is.
	 *			{"A(Y)" : "[Book1]1!A", "B(Y)" : "[Book1]1!A"}
	 *
	 *	ORANGECONTROL_HUNT is a call to initiate the range-hunting feature.
	 *		It uses the get_interative_selection_range() function which requires a handle
	 *		to the HTMLDlg window. So if you route the request to a non-class function, be
	 *		sure to pass a GetSafeHwnd() call as an HWND type parameter to the function.
	 *		Not only can a valid range string be returned, an empty string or even
	 *		"_INVALID_" can be returned if desired.
	 *
	 *	ORANGECONTROL_VALIDATE is a request to validate a range string. To indicate the
	 *		string is valid, simply return the string passed in. To indicate invalid,
	 * 		return "_INVALID_".
	 *
	 * NOTE- the following line must be added to the defined BEGIN_DISPATCH_MAP macro:
	 * 		DISP_FUNCTION(<Your dialog class>, ORangeControlOCFunc, VTS_STR, VTS_STR VTS_I4 VTS_STR)
	 *
	 */
	 enum {
		// Don't use 0 because Javascript can interpret 0 in many ways.
		ORANGECONTROL_GET_RANGE = 1,
		ORANGECONTROL_GET_FLYOUT = 2,
		ORANGECONTROL_HUNT = 3,
		ORANGECONTROL_VALIDATE = 4,
	};
	string ORangeControlOCFunc(string strORangeControlId, int nRequest, string strRange)
	{
		string strRet;
		switch(nRequest)
		{
			case ORANGECONTROL_GET_RANGE:
				if( 0 == strORangeControlId.CompareNoCase("irng") )
					return m_strInitSelRange;
				else if( 0 == strORangeControlId.CompareNoCase("orng") )
					return "(<input>,<new>)";

				break;

			case ORANGECONTROL_GET_FLYOUT:
				if( 0 == strORangeControlId.CompareNoCase("irng") )
					return m_strRangeListAsJSON;
				else if( 0 == strORangeControlId.CompareNoCase("orng") )
					return GetOutputRangeListAsJSON();
				else
					return "{}";

				break;

			case ORANGECONTROL_HUNT:
				if( 0 == strORangeControlId.CompareNoCase("irng") )
				{
					DWORD dwOptions = ICOPT_ALLOW_X_SAMPLING | ICOPT_RESTRICT_TO_ONE_DATA | ICOPT_INPUT | ICOPT_RESTRICT_TO_Y_COLUMNS;
					return get_interative_selection_range(dwOptions, GetSafeHwnd(), strRange, NULL, 0, InterRangeType_XYRange);

				}
				break;

			case ORANGECONTROL_VALIDATE:
				if( 0 == strORangeControlId.CompareNoCase("irng") )
				{
					XYRange xyr;
					xyr.Create(strRange, XVT_XYDATARANGE);

					DWORD dwRules = DRR_GET_DEPENDENT | DRR_NO_FACTORS | DRR_ONE_DATA;
					if( !xyr.IsValid() || !xyr.IsReal() || 1 != xyr.GetNumData(dwRules) )
						return "_INVALID_";

					return strRange;
				}
				break;

			default:
				break;
		}
		return strRet;
	}

protected:
	DECLARE_DISPATCH_MAP

	EVENTS_BEGIN_DERIV(HTMLDlg)
		ON_INIT(OnInitDialog)
		ON_DESTROY(OnDestroy)
		ON_SIZE(OnDlgResize)
	EVENTS_END_DERIV

	string GetJSPath()
	{
		string path = GetOriginPath() + "JS\\";
		return path;
	}

	string GetInitURL()
	{
		string strFile = __FILE__;
		return GetFilePath(strFile) + "PiecewiseSmooth.html";
	}

	string GetDialogTitle() {return STR_PIECEWISE_SMOOTH_DLG_TITLE;}

	BOOL OnInitDialog()
	{
		HTMLDlg::OnInitDialog();
		ModifyStyle(0, WS_MAXIMIZEBOX);

		RECT rect;
		m_gcCntrl.CreateControl(GetSafeHwnd(), &rect, ID_GRAPH_CONTROL, WS_CHILD|WS_VISIBLE|WS_BORDER);

		// Attach graph page to dialog's graph control.
		// Set options to disable clicking on various graph components, see more in OC_const.h
		DWORD dwOptions = NOCLICK_AXES | NOCLICK_DATA_PLOT | NOCLICK_LAYER | NOCLICK_TICKLABEL | NOCLICK_LAYERICON;
		m_gcCntrl.AttachPage(m_gp, dwOptions);

		m_gcCntrl.Visible = false;

		return TRUE;
	}

	BOOL OnDestroy()
	{
		/// Kenny 08/22/2017 QA-2782-P3 HTML_APP_PIECEWISE_SMOOTH_CRASH
		m_gcCntrl.DetachPage();
		if( m_gp.IsValid() )
			m_gp.Destroy();
		if( m_wksTemp.IsValid() )
		{
			WorksheetPage wksp = m_wksTemp.GetPage();
			wksp.Destroy();
		}
		/// End HTML_APP_PIECEWISE_SMOOTH_CRASH
		HTMLDlg::OnDestroy();
		return TRUE;
	}

	BOOL GetDlgInitSize(int& width, int& height)
	{
		width = 1000;
		height = 575;
		return TRUE;
	}

	BOOL OnDlgResize(int nType, int cx, int cy)
	{
		if( !IsInitReady() )
			return false;

		// MoveControlsHelper _temp(this); // you can uncomment this line, if the dialog flickers when you resize it
		HTMLDlg::OnDlgResize(nType, cx, cy);

		if( !IsHTMLDocumentCompleted() )
			return FALSE;

		RECT rectGraph;
		if( !GetGraphRECT(rectGraph) )
			return FALSE;

		m_gcCntrl.SetWindowPos(HWND_TOP, rectGraph.left, rectGraph.top, RECT_WIDTH(rectGraph), RECT_HEIGHT(rectGraph), 0);

		return TRUE;
	}

private:
	BOOL GetGraphRECT(RECT &rect)
	{
		if( !m_dhtml )
			return FALSE;

		Object js = m_dhtml.GetScript();

		if( !js )
			return FALSE;

		string str = js.getGraphRect();
		JSON.FromString(rect, str);

		//#if _OC_VER >= 0x0950
			//check_convert_rect_with_DPI(GetWindow(), rect, true);
		//#endif
		// CHD- Quick fix for issues with Hi DPI and GraphControl positioning.
		_check_convert_rect_polyfill(GetWindow(), rect);

		return TRUE;
	}

	void ChangeSettingsControlsFromOC()
	{
		if( !m_dhtml )
			return;

		Object js = m_dhtml.GetScript();

		if( !js )
			return;

		string strJSON;
		JSON.ToString(m_stSettings, strJSON);
		js.changeSettingsControlsFromOC(strJSON);
	}

	/*
	 * Function performs actual smoothing within ROI based on indices determined
	 * by a prior call to SetROIValidPosition().
	 */
	bool SmoothROI()
	{
		waitCursor junk;

		vector vec;
		vec.SetSize(0);
		m_xyrROI.SetData(&vec, &vec, 0, NULL, 0);

		if( !m_bHasInputData || m_nSmoothingIdx2 == m_nSmoothingIdx1 )
			return false;

		vector vWorkingX, vWorkingY;
		m_xyrWorking.GetData(vWorkingY, vWorkingX, NULL, 0, DRR_GET_DEPENDENT);

		//if( vWorkingY.GetSize() <= abs(m_nSmoothingIdx2 - m_nSmoothingIdx1) + 1 )
		if( vWorkingY.GetSize() <= abs(m_nSmoothingIdx2 - m_nSmoothingIdx1) )
			return false;

		vector vSubX, vSubY;
		vWorkingX.GetSubVector(vSubX, m_nSmoothingIdx1, m_nSmoothingIdx2);
		vWorkingY.GetSubVector(vSubY, m_nSmoothingIdx1, m_nSmoothingIdx2);
		int nSize = vSubY.GetSize();

		vector vSmoothedY;
		vSmoothedY.SetSize(nSize);

		int nMethod = m_stSettings.method;
		bool bWeight = m_stSettings.weight;
		int nPolyOrder = m_stSettings.polyorder;
		double dPercent = m_stSettings.percent;
		int nNpts = m_stSettings.npts;
		int nBoundary = m_stSettings.boundary;//Zero-based: based on enum {EDGEPAD_NONE, EDGEPAD_REFLECT, EDGEPAD_REPEAT, EDGEPAD_PERIODIC, EDGEPAD_EXTRAPOLATE, EDGEPAD_ZERO};

		int nOrder = 1;

		// Origin smooth XF actually uses integer npts despite allowing
		// fractional values in GUI!

		// Method is zero-based: 0=AA, 1=SG, 2=Percentile, 3=FFT.
		if( 3 == nMethod ) // FFT.
		{
			if( nNpts < 2 )
				nNpts = 2;

			int nMaxPoints = vSubX.GetSize();
			if( nNpts > nMaxPoints )
				nNpts = nMaxPoints;

			m_stSettings.npts = nNpts;

			double dMin, dMax;
			vSubX.GetMinMax(dMin, dMax);
			double dCutoff = ( ((nSize-1) / (dMax-dMin) / 2) ) / nNpts;

			int nFilter = LOW_PASS_PARABOLIC_FILTERING;
			int nBaseline = BASELINE_TWO_ENDS_1_PERCENT;//BASELINE_TWO_ENDS;
			int nPad = 0;
			fft_smooth(nSize, nNpts, dCutoff, vSubX, vSubY, vSmoothedY, nPad, nFilter, nBaseline, false);
		}
		else
		{
			int nMaxPoints = vSubY.GetSize();

			if( 0 == nMethod ) // Adjacent Averaging.
			{
				if( nNpts < 2 )
					nNpts = 2;
				else if( nNpts > nMaxPoints )
					nNpts = nMaxPoints;
			}
			else if( 1 == nMethod ) // Savitzky-Golay.
			{
				if( nNpts < 3 )
					nNpts = 3;
				else if( nNpts >= nMaxPoints )
					nNpts = nMaxPoints - 1;
			}
			else // 2- Percentile Filter.
			{
				if( nNpts < 2 )
					nNpts = 2;
				else if( nNpts >= nMaxPoints )
					nNpts = nMaxPoints - 1;
			}

			// Polyorder  is zero-based: 0=1st, 1=2nd, 2=3rd.
			// Makes sure polyorder is less than number of points.
			while (nPolyOrder >= nNpts-1)
			{
				nPolyOrder -= 1;
			}

			m_stSettings.npts = nNpts;
			m_stSettings.maxpoints = nMaxPoints;
			m_stSettings.polyorder = nPolyOrder;

			// Add 1 to Polyorder so it is now 1 based:  1=1st, 2=2nd, 3=3rd
			// for call to ocmath_smooth().
			nPolyOrder += 1;

			int nRet = OE_UNKOWN_ERROR;
			try {
				nRet = ocmath_smooth(nSize, vSubY, vSmoothedY, nNpts/2, nMethod, nBoundary, nNpts/2, nPolyOrder, 0, dPercent, bWeight, false, nOrder);
			}
			catch( int nErr )
			{
				string str;
				JSON.ToString(m_stSettings, str);
				printf("ocmath_smooth() Call Error (Try-Catch). Settings: %s\n", str);
				return false;
			}

			if( OE_NOERROR != nRet )
			{
				string str;
				JSON.ToString(m_stSettings, str);
				printf("ocmath_smooth() Call Error. Return: %d; Settings: %s\n", nRet, str);
				return false;
			}
		}

		m_xyrROI.SetData(&vSmoothedY, &vSubX, 0, NULL, 0);

		return true;
	}

	/*
	 * Function adjusts position of ROI to ensure it is within the bounds of the relevant
	 * data indices and contains at least PIECEWISE_SMOOTH_MIN_TOTAL_POINTS data points. Perhaps too convoluted.
	 */
	int SetROIValidPosition(GraphObject &go, const vector& vecIndices, const vector& vecValues, double& dLeft, double& dRight, int* pnLeftIdx = NULL, int* pnRightIdx = NULL, int* pnPoints = NULL)
	{
		int nSize = vecIndices.GetSize();

		if( nSize < PIECEWISE_SMOOTH_MIN_TOTAL_POINTS )
			return PIECEWISE_SMOOTH_DATA_TOO_FEW_POINTS;

		//int nMono = ocmath_is_monotonic(vecIndices, nSize, true);
		int nMono = ocmath_is_monotonic(vecIndices, nSize, false); // Allow for duplicate X next to each other.
		bool bDecreasing = (MONO_DECREASE == nMono);

		FRECT frThumb;
		if( !go.GetTempBoundingBox(&frThumb, GTBB_CALC) )
			return PIECEWISE_SMOOTH_DATA_UNKNOWN_ERR;

		dLeft = frThumb.left;
		dRight = frThumb.right;

		double dStart, dEnd, dWidth;
		dStart = vecIndices[0];
		dEnd = vecIndices[nSize-1];
		dWidth = dRight - dLeft;

		if( bDecreasing )
		{
			double dd1 = dStart;
			dStart = dEnd;
			dEnd = dd1;
		}

		if( dRight < dStart )
		{
			dLeft = dStart;
			dRight = dLeft + dWidth;
		}
		else if( dLeft > dEnd )
		{
			dRight = dEnd;
			dLeft = dRight - dWidth;
		}

		if( dLeft < dStart )
		{
			dLeft = dStart;
			dRight = dLeft + dWidth;
		}

		if( dRight > dEnd )
		{
			dRight = dEnd;
			dLeft = dRight - dWidth;
		}

		int nLeftIdx, nRightIdx;
		ocmath_find_nearest_index(vecIndices, nSize, dLeft, NULL, NULL, &nLeftIdx, !bDecreasing);
		ocmath_find_nearest_index(vecIndices, nSize, dRight, NULL, NULL, &nRightIdx, !bDecreasing);

		if( bDecreasing )
		{
			int nn = nLeftIdx;
			nLeftIdx = nRightIdx;
			nRightIdx = nn;
		}

		// Must be better way to do below.
		int nIdxDiff = abs(nRightIdx - nLeftIdx);
		if( nIdxDiff < 4 )
		{
			if( nSize-1 == nRightIdx )
				nLeftIdx = nRightIdx - 4;
			else if( nSize-2 == nRightIdx )
			{
				nRightIdx = nRightIdx + 1;
				nLeftIdx = nRightIdx - 3;
			}
			else if( 0 == nLeftIdx )
				nRightIdx = nLeftIdx + 4;
			else if( 1 == nLeftIdx )
			{
				nLeftIdx = 0;
				nRightIdx = 4;
			}
			else
			{
				nLeftIdx -= 2;
				nRightIdx += 2;
			}
		}
		dLeft = vecIndices[nLeftIdx];
		dRight = vecIndices[nRightIdx];

		int nPoints = abs(nRightIdx - nLeftIdx) + 1;

		if( pnLeftIdx )
			*pnLeftIdx = nLeftIdx;

		if( pnRightIdx)
			*pnRightIdx = nRightIdx;

		if( pnPoints )
			*pnPoints = nPoints;

		// Get previous Script, Run After.
		Tree trEvent;
		trEvent = go.GetFormat(FPB_ALL, FOB_ALL, true, true);
		int nEvent = trEvent.Root.Event.nVal;

		// Temporarily set Script, Run After to None.
		ChangeScriptRunAfter(go, GRCT_NONE);

		Tree tr;
		tr.Root.Dimension.Attachment.nVal = 2; // Layer and Scale
		tr.Root.Dimension.Units.nVal = UNITS_SCALE;
		tr.Root.Dimension.Left.dVal = dLeft;
		tr.Root.Dimension.Width.dVal = dRight - dLeft;
		int nErr = go.UpdateThemeIDs(tr.Root);
		if (0 == nErr)
			go.ApplyFormat(tr, false, true);

		// Restore previous Script, Run After.
		ChangeScriptRunAfter(go, nEvent);

		return PIECEWISE_SMOOTH_DATA_OK;
	}

	void ChangeScriptRunAfter(GraphObject &go, int nEvent)
	{
		Tree tr;
		tr.Root.Event.nVal = nEvent;
		int nErr = go.UpdateThemeIDs(tr.Root);
		if( 0 == nErr )
			go.ApplyFormat(tr, false, true);

	}

	string GetSelectedXYRange()
	{
		string strRet;

		Tree trSelected;
		int nErrorCode;
		OriginObject oObj;
		int nType;
		DWORD dwRules = DRR_GET_DEPENDENT | DRR_NO_FACTORS | DRR_ONE_DATA;
		if( !Project.InitInputDataBranchFromSelection(trSelected, dwRules, &nErrorCode, oObj, &nType) )
			return strRet;

		if( EXIST_WKS != nType && EXIST_GRAPH != nType )
			return strRet;

		// Remove Y error column from TreeNode if it is part of selection.
		foreach(TreeNode tn in trSelected.Children)
		{
			tn.RemoveChild("ED");
		}

		XYRange xyr;
		xyr.Create(trSelected, false);
		if( !xyr.IsValid() )
			return strRet;

		// Loose dataset fix.
		// Only have to check below in case of workbook active- graph will be
		// okay if XYRange valid.
		if( EXIST_WKS == nType )
		{
			Column colX, colY;
			xyr.GetXColumn(colX);
			xyr.GetYColumn(colY);

			if( OKDATAOBJ_DESIGNATION_Y != colY.GetType() )
				return strRet;

			// Make sure both X & Y have same row range.
			// If not set X row range same as Y.
			if( colX.IsValid() )
			{
				int r1, c1, r2, c2, nY1, nY2;
				Worksheet wksTemp;
				colY.GetParent(wksTemp);
				xyr.GetRange(1, r1, c1, r2, c2, wksTemp);
				nY1 = r1, nY2 = r2;
				colX.GetParent(wksTemp);
				xyr.GetRange(0, r1, c1, r2, c2, wksTemp);
				if( r1 != nY1 || r2 != nY2)
					xyr.SetRange(0, wksTemp, nY1, c1, nY2, c2);
			}

			bool bAutoX = colY.IsEvenSampling();

			xyr.GetRangeString(strRet);

			// Quick way to specify <autoX>.
			if( EXIST_WKS == nType && bAutoX && strRet.Find("!(,") > -1 )
			{
				string strAutoX = "!(" + STR_PIECEWISE_SMOOTH_AUTOX + ",";
				strRet.Replace("!(,", strAutoX);
			}
		}
		else
			xyr.GetRangeString(strRet, NTYPE_FOR_RANGE);

		return strRet;
	}

	string GetXYRangeListAsJSON(Layer lay)//Worksheet wks)
	{
		string strDef = "{}";

		vector<string> vsKeys, vsValues;

		Worksheet wks(lay);
		if( wks.IsValid() )
		{
			foreach(Column col in wks.Columns)
			{
				if( OKDATAOBJ_DESIGNATION_Y != col.GetType() )
					continue;

				string strKey;
				strKey.Format("%s(%s) : %s", col.GetName(), DataRangeTypeToName(col.GetType()), col.GetLongName());
				strKey.TrimRight(" :");
				vsKeys.Add(strKey);

				string strTemp;
				col.GetRangeString(strTemp, NTYPE_BOOKSHEET_XY_RANGE);

				XYRange xyr;;
				xyr.Create(strTemp, XVT_XYDATARANGE);
				if( xyr.IsValid() )
				{
					Column colY, colX;
					xyr.GetYColumn(colY);
					xyr.GetXColumn(colX);

					bool bAutoX = colY.IsEvenSampling();

					string strNewRange;
					xyr.GetRangeString(strNewRange, NTYPE_BOOKSHEET_XY_RANGE);

					// Quick way to specify <autoX>.
					if( bAutoX && strNewRange.Find("!(,") > -1 )
					{
						string strAutoX = "!(" + STR_PIECEWISE_SMOOTH_AUTOX + ",";
						strNewRange.Replace("!(,", strAutoX);
					}

					vsValues.Add(strNewRange);
				}
			}
		}

		GraphLayer gl(lay);
		if( gl.IsValid() )
		{
			foreach(DataPlot dp in gl.DataPlots)
			{
				XYRange xyr;
				dp.GetDataRange(xyr);
				if( xyr.IsValid() )
				{
					string strColName;
					Column colY;
					xyr.GetYColumn(colY);

					// Loose dataset fix.
					if( colY.IsValid())
					{
						strColName = colY.GetLongName();
						if( strColName.IsEmpty() )
							strColName = colY.GetName();
					}
					else // Loose dataset such as OGG.
					{
						string strY;
						xyr.GetDatasetNames(strY);
						DatasetObject ds(strY);
						if( !ds.IsValid() ) // Fix for some plots throwing dataset attach error.
							continue;
						ds.GetLabel(strColName, RCLT_LONG_NAME, false);
						if( strColName.IsEmpty() )
							strColName = strY.GetToken(1, '_');
					}

					string strKey;
					strKey.Format("%s(%d) : %s", STR_PIECEWISE_SMOOTH_PLOT, dp.GetIndex()+1, strColName);
					strKey.TrimRight(" :");
					vsKeys.Add(strKey);

					string strNewRange;
					xyr.GetRangeString(strNewRange, NTYPE_FOR_RANGE);
					vsValues.Add(strNewRange);
				}
			}
		}

		if( 0 == vsKeys.GetSize() )
			return strDef;

		string str;
		json_generate_key_value_str(&str, &vsKeys, &vsValues);
		return str;
	}

	string GetOutputRangeListAsJSON()
	{
		vector<string> vsKeys, vsValues;
		GetOutputRanges(vsKeys, vsValues);

		string str;
		json_generate_key_value_str(&str, &vsKeys, &vsValues);
		return str;
	}

	int GetOutputRanges(vector<string>& vsKeys, vector<string>& vsValues)
	{
		vsKeys.SetSize(0);
		vsValues.SetSize(0);

		// Don't localize range values because OkClick() relies on
		// English version of them.

		// Don't allow this output.
		//vsKeys.Add(STR_PIECEWISE_SMOOTH_INPUT_XY);
		//vsValues.Add("(<input>,<input>)");

		vsKeys.Add(STR_PIECEWISE_SMOOTH_NEW_COL);
		vsValues.Add("(<input>,<new>)");

		vsKeys.Add(STR_PIECEWISE_SMOOTH_NEW_XY);
		vsValues.Add("(<new>,<new>)");

		vsKeys.Add(STR_PIECEWISE_SMOOTH_NEW_SHEET);
		vsValues.Add("<new>!(<new>,<new>)");

		vsKeys.Add(STR_PIECEWISE_SMOOTH_NEWBOOK);
		vsValues.Add("[<new>]<new>!(<new>,<new>)");

		return vsValues.GetSize();
	}

private:
	stPiecewiseSmoothSettings m_stSettings;
	string m_strInitSelRange;
	bool m_bHasInputData;
	string m_strRangeListAsJSON;
	Worksheet m_wksTemp;
	GraphPage m_gp;
	GraphControl m_gcCntrl;
	GraphObject m_goROI;
	XYRange m_xyrInput;
	XYRange m_xyrWorking;
	XYRange m_xyrSmoothed;
	XYRange m_xyrROI;
	int m_nSmoothingIdx1;
	int m_nSmoothingIdx2;

	double m_PrevAtBDPI;
};

BEGIN_DISPATCH_MAP(PiecewiseSmoothDlg, HTMLDlg)
	DISP_FUNCTION(PiecewiseSmoothDlg, LoadSharedFile, VTS_STR, VTS_STR)

	DISP_FUNCTION(PiecewiseSmoothDlg, GetSettings, VTS_STR, VTS_VOID)
	DISP_FUNCTION(PiecewiseSmoothDlg, SettingsControlsChanged, VTS_VOID, VTS_STR)
	DISP_FUNCTION(PiecewiseSmoothDlg, SmoothROIClick, VTS_I4, VTS_STR)
	DISP_FUNCTION(PiecewiseSmoothDlg, OkClick, VTS_VOID, VTS_STR)
	DISP_FUNCTION(PiecewiseSmoothDlg, CancelClick, VTS_VOID, VTS_VOID)
	DISP_FUNCTION(PiecewiseSmoothDlg, LoadInputData, VTS_I4, VTS_STR VTS_I4)
	DISP_FUNCTION(PiecewiseSmoothDlg, ORangeControlOCFunc, VTS_STR, VTS_STR VTS_I4 VTS_STR)
END_DISPATCH_MAP

// CHD- Quick fix for issues with Hi DPI and GraphControl positioning.
static bool _check_convert_rect_polyfill(Window& wnd, RECT& rect)
{
	#if _OC_VER >= 0x0950
		return check_convert_rect_with_DPI(wnd, rect, true);
	#endif

	if( !(int)get_sys_values("BDPI") )
		return false;

	double dXScale = okutil_get_DPI_scale_factor(LOGPIXELSX);
	double dYScale = okutil_get_DPI_scale_factor(LOGPIXELSY);
	rect.left	= rect.left * dXScale;
	rect.top	= rect.top * dYScale;
	rect.right	= rect.right * dXScale;
	rect.bottom	= rect.bottom * dYScale;
	return true;
}


#pragma labtalk(1) // Enable for LabTalk calling.

void PiecewiseSmoothDlgUserMoveROI()
{
	if( s_pPiecewiseSmoothDlg )
		s_pPiecewiseSmoothDlg->MoveROI();
}


void PiecewiseSmooth_Run()
{
	LTVarTempChange temp1("@MZ", 0);
	LTVarTempChange temp2("@MP", 1);
	if( s_pPiecewiseSmoothDlg == NULL )
	{
		PiecewiseSmoothDlg dlg;
		s_pPiecewiseSmoothDlg = &dlg;
		dlg.DoModalEx(GetWindow());
		s_pPiecewiseSmoothDlg = NULL;
	}
}

// 快速批处理函数 - 跳过对话框，直接处理当前选中数据
void PiecewiseSmooth_QuickBatch()
{
	LTVarTempChange temp1("@MZ", 0);
	LTVarTempChange temp2("@MP", 1);
	
	waitCursor junk;
	
	// 获取当前选中的数据
	Tree trSelected;
	int nErrorCode;
	OriginObject oObj;
	int nType;
	DWORD dwRules = DRR_GET_DEPENDENT | DRR_NO_FACTORS | DRR_ONE_DATA;
	
	if( !Project.InitInputDataBranchFromSelection(trSelected, dwRules, &nErrorCode, oObj, &nType) )
	{
		printf("Error: No valid data selected. Please select a Y column or plot.\n");
		return;
	}
	
	if( EXIST_WKS != nType && EXIST_GRAPH != nType )
	{
		printf("Error: Please select data from a worksheet or graph.\n");
		return;
	}
	
	// 移除Y error列
	foreach(TreeNode tn in trSelected.Children)
	{
		tn.RemoveChild("ED");
	}
	
	XYRange xyrInput;
	xyrInput.Create(trSelected, false);
	if( !xyrInput.IsValid() )
	{
		printf("Error: Invalid data range.\n");
		return;
	}
	
	// 获取输入数据
	vector vInputX, vInputY;
	xyrInput.GetData(vInputY, vInputX, NULL, 0, DRR_GET_DEPENDENT);
	
	int nSize = vInputY.GetSize();
	if( nSize < PIECEWISE_SMOOTH_MIN_TOTAL_POINTS )
	{
		printf("Error: Too few data points (minimum %d required).\n", PIECEWISE_SMOOTH_MIN_TOTAL_POINTS);
		return;
	}
	
	// 检查X是否单调
	int nMono = ocmath_is_monotonic(vInputX, vInputX.GetSize(), false);
	if( MONO_INCREASE != nMono && MONO_DECREASE != nMono )
	{
		printf("Error: X data must be monotonic.\n");
		return;
	}
	
	// 使用默认设置
	stPiecewiseSmoothSettings stSettings;
	stSettings.InitDefault();
	// 默认：Savitzky-Golay, 2nd order, 20 points
	
	// 执行平滑
	vector vSmoothedY;
	vSmoothedY.SetSize(nSize);
	
	int nMethod = stSettings.method; // 1 = SG
	bool bWeight = stSettings.weight; // false
	int nPolyOrder = stSettings.polyorder + 1; // 2nd order (1+1=2)
	int nNpts = stSettings.npts; // 20
	int nBoundary = stSettings.boundary; // 0 = EDGEPAD_NONE
	double dPercent = stSettings.percent; // 50
	int nOrder = 1;
	
	// 确保npts有效
	if( nNpts < 3 )
		nNpts = 3;
	else if( nNpts >= nSize )
		nNpts = nSize - 1;
	
	// 确保polyorder < npts
	while (nPolyOrder >= nNpts)
	{
		nPolyOrder -= 1;
	}
	
	int nRet = ocmath_smooth(nSize, vInputY, vSmoothedY, nNpts/2, nMethod, nBoundary, nNpts/2, nPolyOrder, 0, dPercent, bWeight, false, nOrder);
	
	if( OE_NOERROR != nRet )
	{
		printf("Error: Smoothing failed with error code %d.\n", nRet);
		return;
	}
	
	// 输出到新列
	Column colInputY, colInputX;
	int nRow1, nRow2;
	xyrInput.GetYColumn(colInputY, 0, &nRow1, &nRow2);
	xyrInput.GetXColumn(colInputX, 0);
	
	if( !colInputY.IsValid() )
	{
		printf("Error: Cannot output results for loose dataset. Please use the full dialog.\n");
		return;
	}
	
	Worksheet wksInput;
	colInputY.GetParent(wksInput);
	WorksheetPage wkspInput = wksInput.GetPage();
	
	// 在同一工作表添加新列
	Column colOutputY = wksInput.Columns(wksInput.AddCol());
	
	string strColName = colInputY.GetLongName();
	if( strColName.IsEmpty() )
		strColName = colInputY.GetName();
	
	colOutputY.SetType(OKDATAOBJ_DESIGNATION_Y);
	colOutputY.SetLongName("Smoothed " + strColName);
	colOutputY.SetUnits(colInputY.GetUnits());
	
	string strComments;
	strComments.Format("Piecewise Smooth (Quick Batch) of %s", xyrInput.GetDescription(GETLC_COL_LN_ONLY));
	colOutputY.SetComments(strComments);
	
	// 创建输出范围
	XYRange xyrOutput;
	if( colInputX.IsValid() )
	{
		xyrOutput.Add("X", wksInput, nRow1, colInputX.GetIndex(), nRow2, colInputX.GetIndex());
		xyrOutput.Add("Y", wksInput, nRow1, colOutputY.GetIndex(), nRow2, colOutputY.GetIndex());
	}
	else
	{
		xyrOutput.Add(wksInput, colOutputY.GetIndex(), "Y");
	}
	
	if( xyrOutput.IsValid() )
	{
		vector<int> vnMissingValsIndices;
		xyrInput.GetData(vInputY, vInputX, NULL, 0, DRR_GET_DEPENDENT, &vnMissingValsIndices);
		
		set_xyrange_data_ex(xyrOutput, &vSmoothedY, &vInputX, 0, xyrInput, &vnMissingValsIndices);
		
		wkspInput.SetShow(PAGE_ACTIVATE);
		string strLT;
		strLT.Format("page.active=%d;", wksInput.GetIndex()+1);
		wkspInput.LT_execute(strLT);
		
		printf("Smoothing completed successfully. Output column: %s\n", colOutputY.GetName());
	}
	else
	{
		printf("Error: Failed to create output range.\n");
	}
}

#pragma labtalk(1) // 确保此函数能被 LabTalk 调用

// 新函数：接受范围字符串参数，进行分段平滑处理
// 示例LabTalk调用：PiecewiseSmooth_Column "[Book1]Sheet1!col(B)" 或 PiecewiseSmooth_Column "[Book1]Sheet1!(A,B)"
// 默认使用Savitzky-Golay方法，2阶，20点窗口
// 输出到同一工作表的新Y列，X保持原样
void PiecewiseSmooth_Column(string strRange)
{
    if (strRange.IsEmpty()) {
        printf("Error: Input range is empty.\n");
        return;
    }
    
    waitCursor junk;
    
    // 创建XYRange
    XYRange xyrInput;
    if (!okxf_init_range_from_string(&xyrInput, strRange)) {
        printf("Error: Invalid input range '%s'.\n", strRange);
        return;
    }
    
    if (!xyrInput.IsValid()) {
        printf("Error: Invalid data range.\n");
        return;
    }
    
    // 获取数据
    vector vInputX, vInputY;
    vector<int> vnMissingValsIndices;
    xyrInput.GetData(vInputY, vInputX, NULL, 0, DRR_GET_DEPENDENT, &vnMissingValsIndices);
    
    int nSize = vInputY.GetSize();
    if (nSize < PIECEWISE_SMOOTH_MIN_TOTAL_POINTS) {
        printf("Error: Too few data points (minimum %d required).\n", PIECEWISE_SMOOTH_MIN_TOTAL_POINTS);
        return;
    }
    
    // 检查X是否单调
    int nMono = ocmath_is_monotonic(vInputX, vInputX.GetSize(), false);
    if (MONO_INCREASE != nMono && MONO_DECREASE != nMono) {
        printf("Error: X data must be monotonic.\n");
        return;
    }
    
    // 使用默认设置
    stPiecewiseSmoothSettings stSettings;
    stSettings.InitDefault(); // 默认：Savitzky-Golay, 2nd order, 20 points, etc.
    
    // 执行平滑
    vector vSmoothedY;
    vSmoothedY.SetSize(nSize);
    
    int nMethod = stSettings.method; // 1 = SG
    bool bWeight = stSettings.weight; // false
    int nPolyOrder = stSettings.polyorder + 1; // 2nd order (1+1=2)
    int nNpts = stSettings.npts; // 20
    int nBoundary = stSettings.boundary; // 0 = EDGEPAD_NONE
    double dPercent = stSettings.percent; // 50
    int nOrder = 1;
    
    // 确保npts有效
    if (nNpts < 3) nNpts = 3;
    else if (nNpts >= nSize) nNpts = nSize - 1;
    
    // 确保polyorder < npts
    while (nPolyOrder >= nNpts) {
        nPolyOrder -= 1;
    }
    
    int nRet = ocmath_smooth(nSize, vInputY, vSmoothedY, nNpts/2, nMethod, nBoundary, nNpts/2, nPolyOrder, 0, dPercent, bWeight, false, nOrder);
    
    if (OE_NOERROR != nRet) {
        printf("Error: Smoothing failed with error code %d.\n", nRet);
        return;
    }
    
    // 获取输入列信息
    Column colInputY, colInputX;
    int nRow1, nRow2;
    xyrInput.GetYColumn(colInputY, 0, &nRow1, &nRow2);
    xyrInput.GetXColumn(colInputX, 0);
    
    if (!colInputY.IsValid()) {
        printf("Error: Cannot output results for loose dataset.\n");
        return;
    }
    
    Worksheet wksInput;
    colInputY.GetParent(wksInput);
    WorksheetPage wkspInput = wksInput.GetPage();
    
    // 在同一工作表添加新列
    Column colOutputY = wksInput.Columns(wksInput.AddCol());
    
    string strColName = colInputY.GetLongName();
    if (strColName.IsEmpty()) strColName = colInputY.GetName();
    
    colOutputY.SetType(OKDATAOBJ_DESIGNATION_Y);
    colOutputY.SetLongName("Smoothed " + strColName);
    colOutputY.SetUnits(colInputY.GetUnits());
    
    string strComments;
    strComments.Format("Piecewise Smooth (Column Process) of %s", xyrInput.GetDescription(GETLC_COL_LN_ONLY));
    colOutputY.SetComments(strComments);
    
    // 创建输出范围
    XYRange xyrOutput;
    if (colInputX.IsValid()) {
        xyrOutput.Add("X", wksInput, nRow1, colInputX.GetIndex(), nRow2, colInputX.GetIndex());
        xyrOutput.Add("Y", wksInput, nRow1, colOutputY.GetIndex(), nRow2, colOutputY.GetIndex());
    } else {
        xyrOutput.Add(wksInput, colOutputY.GetIndex(), "Y");
    }
    
    if (xyrOutput.IsValid()) {
        set_xyrange_data_ex(xyrOutput, &vSmoothedY, &vInputX, 0, xyrInput, &vnMissingValsIndices);
        
        wkspInput.SetShow(PAGE_ACTIVATE);
        string strLT;
        strLT.Format("page.active=%d;", wksInput.GetIndex() + 1);
        wkspInput.LT_execute(strLT);
        
        printf("Smoothing completed successfully. Output column: %s\n", colOutputY.GetName());
    } else {
        printf("Error: Failed to create output range.\n");
    }
}




