# frozen_string_literal: true

require 'rouge'

module Rouge
  module Lexers
    class Banetask < RegexLexer
      title 'BaneTask'
      desc 'BaneTask workflow / project template (.bt/.btc/.projbt)'
      tag 'banetask'
      aliases 'bt', 'btc', 'projbt'
      filenames '*.bt', '*.btc', '*.projbt'

      DIRECTIVES = %w[
        source program control when keywords extrakeywords template param runner
        body preprocess process mod meta archive chk tddft pal maxcore
      ].freeze

      PROGRAMS = %w[gaussian orca gamess script other].freeze
      COMMAND_KEYWORDS = %w[
        run scripts mwfn multiwfn archive cp mv mkdir mkdirp keyword result
        banewfn benv fork
      ].freeze
      CONTROL_WORDS = %w[totcore totmem guess waitfreq alert externalinp verbosity geom].freeze
      WHEN_WORDS = %w[defined completed and or].freeze
      MOD_WORDS = %w[charge spin geom freeze oniom fragment add subtract select remove note].freeze
      CONSTANTS = %w[
        origin restart true false yes no on off null
        bash sh gitbash cmd bat dos
        BASH_fcrun BOTH FC AH soc wfn fchk
      ].freeze

      def self.detect?(text)
        return true if text.match?(/^\s*\$(?:"[^"\n]+"|[^\s#]+)/)
        return true if text.match?(/^\s*%(?:#{DIRECTIVES.join('|')})\b/)
        return true if text.match?(/^\s*&INCLUDE\b/i)
        return true if text.match?(/^\s*@foreach\??\b/)
        return true if text.match?(/^\s*(?:define|matrix|ask)\s*:\s*$/)

        false
      end

      state :root do
        rule %r/^(\s*)(#INCLUDE)(\s+)(.+?)\s*$/ do
          groups Text::Whitespace, Keyword::Declaration, Text::Whitespace, Str
        end

        rule %r/^(\s*)(&INCLUDE)(\s+)(.+?)\s*$/i do
          groups Text::Whitespace, Keyword::Declaration, Text::Whitespace, Str
        end

        rule %r/^(\s*)(@foreach\??)(\s+)([A-Za-z_][A-Za-z0-9_.-]*)(\s+)(in)(\s+)(.+?)\s*$/ do
          groups Text::Whitespace, Keyword, Text::Whitespace, Name::Variable,
                 Text::Whitespace, Operator::Word, Text::Whitespace, Str
        end

        rule %r/^(\s*)(@foreach\??)(\s+)([A-Za-z_][A-Za-z0-9_.-]*)\s*$/ do
          groups Text::Whitespace, Keyword, Text::Whitespace, Name::Variable
        end

        rule %r/^(\s*)(@end)\b.*$/ do
          groups Text::Whitespace, Keyword
        end

        rule %r/^(\s*)(%(?:extrakeywords|body))(\s*)(<<)(\s*)(.+?)\s*$/ do |m|
          groups Text::Whitespace, Keyword::Declaration, Text::Whitespace,
                 Operator, Text::Whitespace, Name::Constant

          terminator = Regexp.escape(m[6].strip)
          push do
            rule %r/^(\s*)(#{terminator})(\s*)$/ do
              groups Text::Whitespace, Name::Constant, Text::Whitespace
              pop!
            end

            mixin :embedded_values
            mixin :strings

            rule %r/[^\[{\n'\"]+/, Str::Heredoc
            rule %r/\n/, Text::Whitespace
            rule %r/./, Str::Heredoc
          end
        end

        rule %r/^(\s*)(%extrakeywords)\s*$/ do
          groups Text::Whitespace, Keyword::Declaration
          push :legacy_extrakeywords
        end

        rule %r/^(\s*)(%body)\s*$/ do
          groups Text::Whitespace, Keyword::Declaration
          push :legacy_body
        end

        rule %r/^(\s*)(end)(\s+)(?:body|exkwd)\s*$/ do
          groups Text::Whitespace, Keyword::Reserved, Text::Whitespace
        end

        rule %r/^(\s*)(\$)("[^"\n]+"|[^\s#]+)/ do
          groups Text::Whitespace, Punctuation, Name::Function
        end

        rule %r/^(\s*)(define|matrix|ask)(\s*)(:)\s*$/ do
          groups Text::Whitespace, Keyword::Declaration, Text::Whitespace, Punctuation
        end

        rule %r/^(\s*)([A-Za-z_][\w.-]*)(\s*)(:)\s*/ do
          groups Text::Whitespace, Name::Label, Text::Whitespace, Punctuation
        end

        rule %r/^(\s*)(%(?:#{DIRECTIVES.join('|')}))\b/ do
          groups Text::Whitespace, Keyword::Declaration
        end

        rule %r/#.*$/, Comment::Single

        mixin :embedded_values
        mixin :strings

        rule %r/\b(?:#{PROGRAMS.join('|')})\b/, Name::Builtin
        rule %r/\b(?:#{COMMAND_KEYWORDS.join('|')})\b/, Keyword
        rule %r/\b(?:#{CONTROL_WORDS.join('|')})\b/, Keyword::Reserved
        rule %r/\b(?:#{WHEN_WORDS.join('|')})\b/, Operator::Word
        rule %r/\b(?:#{MOD_WORDS.join('|')})\b/, Name::Attribute
        rule %r/\b(?:#{CONSTANTS.join('|')})\b/, Keyword::Constant

        rule %r/\b[A-Za-z_][\w.-]*(?=\s*=)/, Name::Attribute
        rule %r/\b\d+(?:\.\d+)?\b/, Num
        rule %r/==|!=|<=|>=|=|<|>|<</, Operator
        rule %r/[{}(),:]/, Punctuation
        rule %r/-default-/, Name::Constant
        rule %r/[A-Za-z_][\w.-]*/, Name
        rule %r/\s+/, Text::Whitespace
        rule %r/./, Text
      end

      state :legacy_extrakeywords do
        rule %r/^(\s*)(end)(\s+)(exkwd)\s*$/ do
          groups Text::Whitespace, Keyword::Reserved, Text::Whitespace, Keyword::Reserved
          pop!
        end

        mixin :embedded_values
        mixin :strings

        rule %r/[^\[{\n'\"]+/, Str
        rule %r/\n/, Text::Whitespace
        rule %r/./, Str
      end

      state :legacy_body do
        rule %r/^(\s*)(end)(\s+)(body)\s*$/ do
          groups Text::Whitespace, Keyword::Reserved, Text::Whitespace, Keyword::Reserved
          pop!
        end

        mixin :embedded_values
        mixin :strings

        rule %r/[^\[{\n'\"]+/, Str
        rule %r/\n/, Text::Whitespace
        rule %r/./, Str
      end

      state :embedded_values do
        rule %r/\{\{\s*[A-Za-z_][\w.-]*\s*\}\}/, Name::Builtin
        rule %r/\[[^\]\n]+\]/, Name::Variable
      end

      state :strings do
        rule %r/"/, Str::Double, :double_string
        rule %r/'/, Str::Single, :single_string
      end

      state :double_string do
        rule %r/"/, Str::Double, :pop!
        rule %r/\\./, Str::Escape
        mixin :embedded_values
        rule %r/[^\\"\[{]+/, Str::Double
        rule %r/./, Str::Double
      end

      state :single_string do
        rule %r/'/, Str::Single, :pop!
        mixin :embedded_values
        rule %r/[^'\[{]+/, Str::Single
        rule %r/./, Str::Single
      end
    end
  end
end
