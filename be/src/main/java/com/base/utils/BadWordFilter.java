package com.base.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BadWordFilter {

    private static final String[] BAD_WORDS = {
            "đm", "dm", "vcl", "cl", "đéo", "dkm", "dcm", "fuck", "bitch", "ngu",
            "cút", "lừa đảo", "bịt bợm", "hãm", "mẹ kiếp", "chó chết", "đĩ", "điếm", "asshole"
    };

    private static Pattern pattern;

    static {

        StringBuilder sb = new StringBuilder("(?i)(?<=^|[^\\p{L}])(");
        for (int i = 0; i < BAD_WORDS.length; i++) {
            sb.append(Pattern.quote(BAD_WORDS[i]));
            if (i < BAD_WORDS.length - 1) {
                sb.append("|");
            }
        }
        sb.append(")(?=$|[^\\p{L}])");
        pattern = Pattern.compile(sb.toString());
    }

    public static boolean containsBadWords(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return pattern.matcher(text).find();
    }

    public static String filter(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        Matcher matcher = pattern.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String match = matcher.group(1);
            String replacement = "*".repeat(match.length());
            matcher.appendReplacement(sb, replacement);
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
