# frozen_string_literal: true

require 'rouge'

module Rouge
  module Lexers
    class Xyz < RegexLexer
      title 'XYZ'
      desc 'XYZ atomic coordinates'
      tag 'xyz'
      filenames '*.xyz'

      start do
        @atoms_remaining = 0
      end

      state :root do
        rule %r/^([ \t]*)(\d+)([ \t]*)(\r?\n|\z)/ do |m|
          groups Text::Whitespace, Num::Integer, Text::Whitespace, Text::Whitespace
          @atoms_remaining = m[2].to_i
          push :comment
        end

        mixin :atom_values
        rule %r/\r?\n/, Text::Whitespace
      end

      state :comment do
        rule %r/[^\r\n]+/, Comment::Single
        mixin :frame_line_end
      end

      state :frame_line_end do
        rule %r/\r?\n/ do
          token Text::Whitespace
          pop!
          push :atoms if @atoms_remaining.positive?
        end
      end

      state :atoms do
        mixin :atom_values

        rule %r/\r?\n/ do
          token Text::Whitespace
          @atoms_remaining -= 1
          pop! if @atoms_remaining.zero?
        end
      end

      state :atom_values do
        rule %r/^([ \t]*)([A-Z][a-z]?)(?=[ \t])/ do
          groups Text::Whitespace, Name::Builtin
        end

        mixin :values
      end

      state :values do
        rule %r/[ \t]+/, Text::Whitespace
        rule %r/[+-]?(?:\d+\.\d*|\.\d+)(?:[eEdD][+-]?\d+)?/, Num::Float
        rule %r/[+-]?\d+[eEdD][+-]?\d+/, Num::Float
        rule %r/[+-]?\d+\b/, Num::Integer
        rule %r/\b(?:T|F|True|False|true|false|TRUE|FALSE)\b/, Keyword::Constant
        rule %r/"(?:\\.|[^"\\\r\n])*"?/, Str::Double
        rule %r/'(?:\\.|[^'\\\r\n])*'?/, Str::Single
        rule %r/[^ \t\r\n]+/, Str
      end
    end

    class Extxyz < Xyz
      title 'Extended XYZ'
      desc 'Extended XYZ coordinates and metadata'
      tag 'extxyz'
      filenames '*.extxyz'

      prepend :comment do
        rule %r/(?=[^\r\n]*=)/ do
          pop!
          push :metadata
        end
      end

      state :metadata do
        rule %r/("(?:\\.|[^"\\\r\n])*"|[A-Za-z_][\w.-]*)([ \t]*)(=)/ do
          groups Name::Attribute, Text::Whitespace, Operator
        end

        rule %r/[\[\]{},]/, Punctuation
        mixin :frame_line_end
        mixin :values
      end
    end
  end
end
