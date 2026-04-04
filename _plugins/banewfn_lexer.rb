# frozen_string_literal: true

require 'rouge'

module Rouge
  module Lexers
    class Banewfn < RegexLexer
      title 'BaneWfn'
      desc 'BaneWfn workflow script (.bw/.bwc)'
      tag 'banewfn'
      aliases 'bw', 'bwc'
      filenames '*.bw', '*.bwc'

      def self.detect?(text)
        return true if text.match?(/^\s*wfn=/)
        return true if text.match?(/^\s*%process\b/)
        return true if text.match?(/^\s*#>>>\s+BANEWFN_INLINE_CONF_BEGIN\b/)

        false
      end

      state :root do
        rule %r/\s+/, Text::Whitespace

        rule %r/^#>>>\s+BANEWFN_INLINE_CONF_BEGIN\b.*$/, Keyword::Declaration
        rule %r/^#<<<\s+BANEWFN_INLINE_CONF_END\b.*$/, Keyword::Declaration
        rule %r/#.*$/, Comment::Single

        rule %r/^(\s*)(wfn|core|dryrun|nogui|wfn_rebase)(\s*)(=)(\s*)/ do
          groups Text::Whitespace, Keyword::Reserved, Text::Whitespace, Operator, Text::Whitespace
          push :rest_of_line
        end

        rule %r/^(\s*)([A-Za-z_][\w-]*)(\*?=)(\s*)/ do
          groups Text::Whitespace, Name::Variable, Operator, Text::Whitespace
          push :rest_of_line
        end

        rule %r/^(\s*)(\[[^\]\n]+\])/ do
          groups Text::Whitespace, Name::Label
        end

        rule %r/^(\s*)(%process|%raw|%command)\b/ do
          groups Text::Whitespace, Keyword
        end

        rule %r/^(\s*)(end|wait)\b/ do
          groups Text::Whitespace, Keyword::Reserved
        end

        mixin :strings
        mixin :variables

        rule %r/\b\d+(?:\.\d+)?\b/, Num
        rule %r/[A-Za-z_][\w+-]*/, Name::Attribute
        rule %r/./, Text
      end

      state :rest_of_line do
        rule %r/\n/, Text, :pop!
        rule %r/#.*$/, Comment::Single, :pop!

        mixin :strings
        mixin :variables

        rule %r/\b\d+(?:\.\d+)?\b/, Num
        rule %r/\s+/, Text::Whitespace
        rule %r/[^#\s"'$]+/, Str
        rule %r/./, Str
      end

      state :variables do
        rule %r/\$\{?(?:input|output|wfn)\}?/, Name::Builtin
        rule %r/\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/, Name::Variable
      end

      state :strings do
        rule %r/"/, Str::Double, :double_string
        rule %r/'/, Str::Single, :single_string
      end

      state :double_string do
        rule %r/"/, Str::Double, :pop!
        rule %r/\\./, Str::Escape
        mixin :variables
        rule %r/[^\\"$]+/, Str::Double
        rule %r/./, Str::Double
      end

      state :single_string do
        rule %r/'/, Str::Single, :pop!
        rule %r/[^']+/, Str::Single
      end
    end

    class BanewfnConf < RegexLexer
      title 'BaneWfn Conf'
      desc 'BaneWfn module configuration file'
      tag 'bwconf'
      aliases 'banewfn-conf', 'banewfnconf'

      def self.detect?(text)
        return false unless text.match?(/^\s*\[[^\]\n]+\]/)

        text.match?(/^\s*default\s*\{\s*$/) || text.match?(/^\s*\$\{[^}]+\}/)
      end

      state :root do
        rule %r/\s+/, Text::Whitespace
        rule %r/#.*$/, Comment::Single

        rule %r/^(\s*)(\[[^\]\n]+\])/ do
          groups Text::Whitespace, Name::Namespace
        end

        rule %r/^(\s*)(default)(\s*)(\{)\s*$/ do
          groups Text::Whitespace, Keyword, Text::Whitespace, Punctuation
        end

        rule %r/^(\s*)(\})\s*$/ do
          groups Text::Whitespace, Punctuation
        end

        rule %r/^(\s*)([A-Za-z0-9_+\-]+)(\s*)(=)(\s*)/ do
          groups Text::Whitespace, Name::Variable, Text::Whitespace, Operator, Text::Whitespace
          push :rest_of_line
        end

        mixin :strings
        mixin :variables

        rule %r/\b\d+(?:\.\d+)?\b/, Num
        rule %r/[A-Za-z_][\w+-]*/, Name::Attribute
        rule %r/./, Text
      end

      state :rest_of_line do
        rule %r/\n/, Text, :pop!
        rule %r/#.*$/, Comment::Single, :pop!

        mixin :strings
        mixin :variables

        rule %r/\b\d+(?:\.\d+)?\b/, Num
        rule %r/\s+/, Text::Whitespace
        rule %r/[^#\s"'$]+/, Str
        rule %r/./, Str
      end

      state :variables do
        rule %r/\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/, Name::Variable
      end

      state :strings do
        rule %r/"/, Str::Double, :double_string
        rule %r/'/, Str::Single, :single_string
      end

      state :double_string do
        rule %r/"/, Str::Double, :pop!
        rule %r/\\./, Str::Escape
        mixin :variables
        rule %r/[^\\"$]+/, Str::Double
        rule %r/./, Str::Double
      end

      state :single_string do
        rule %r/'/, Str::Single, :pop!
        rule %r/[^']+/, Str::Single
      end
    end
  end
end
