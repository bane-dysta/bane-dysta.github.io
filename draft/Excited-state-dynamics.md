## 辐射跃迁

### ORCA

## 内转换

### ORCA

## 系间窜越

### ORCA

```
!PBE0 DEF2-SVP TIGHTSCF ESD(ISC) CPCM(ETHANOL)
%maxcore  3125
%pal nprocs   64 end
%TDDFT  NROOTS  5
        SROOT   1
        TROOT   2
        TROOTSSL -1
        DOSOC   TRUE
END
%ESD    ISCISHESS       "td_SRR.hess"
        ISCFSHESS       "triplet2_SRR.hess"
        USEJ            TRUE
        DOHT            TRUE
        TEMP            298
        DELE            11548
END
* XYZFILE 1 1 triplet2_SRR_vibronic.xyz
```





