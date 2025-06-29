package com.japangular.quizzingbydoing.backendspeed.jm_dict_e.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EntityReplacer {

  private static final Map<String, String> ENTITY_MAP = new HashMap<>();

  static {
    ENTITY_MAP.put("&MA;", "martial arts term");
    ENTITY_MAP.put("&X;", "rude or X-rated term (not displayed in educational software)");
    ENTITY_MAP.put("&abbr;", "abbreviation");
    ENTITY_MAP.put("&adj-i;", "adjective (keiyoushi)");
    ENTITY_MAP.put("&adj-ix;", "adjective (keiyoushi) - yoi/ii class");
    ENTITY_MAP.put("&adj-na;", "adjectival nouns or quasi-adjectives (keiyodoshi)");
    ENTITY_MAP.put("&adj-no;", "nouns which may take the genitive case particle `no'");
    ENTITY_MAP.put("&adj-pn;", "pre-noun adjectival (rentaishi)");
    ENTITY_MAP.put("&adj-t;", "`taru' adjective");
    ENTITY_MAP.put("&adj-f;", "noun or verb acting prenominally");
    ENTITY_MAP.put("&adv;", "adverb (fukushi)");
    ENTITY_MAP.put("&adv-to;", "adverb taking the `to' particle");
    ENTITY_MAP.put("&arch;", "archaism");
    ENTITY_MAP.put("&ateji;", "ateji (phonetic) reading");
    ENTITY_MAP.put("&aux;", "auxiliary");
    ENTITY_MAP.put("&aux-v;", "auxiliary verb");
    ENTITY_MAP.put("&aux-adj;", "auxiliary adjective");
    ENTITY_MAP.put("&Buddh;", "Buddhist term");
    ENTITY_MAP.put("&chem;", "chemistry term");
    ENTITY_MAP.put("&chn;", "children's language");
    ENTITY_MAP.put("&col;", "colloquialism");
    ENTITY_MAP.put("&comp;", "computer terminology");
    ENTITY_MAP.put("&conj;", "conjunction");
    ENTITY_MAP.put("&cop-da;", "copula");
    ENTITY_MAP.put("&ctr;", "counter");
    ENTITY_MAP.put("&derog;", "derogatory");
    ENTITY_MAP.put("&eK;", "exclusively kanji");
    ENTITY_MAP.put("&ek;", "exclusively kana");
    ENTITY_MAP.put("&exp;", "expressions (phrases, clauses, etc.)");
    ENTITY_MAP.put("&fam;", "familiar language");
    ENTITY_MAP.put("&fem;", "female term or language");
    ENTITY_MAP.put("&food;", "food term");
    ENTITY_MAP.put("&geom;", "geometry term");
    ENTITY_MAP.put("&gikun;", "gikun (meaning as reading) or jukujikun (special kanji reading)");
    ENTITY_MAP.put("&hon;", "honorific or respectful (sonkeigo) language");
    ENTITY_MAP.put("&hum;", "humble (kenjougo) language");
    ENTITY_MAP.put("&iK;", "word containing irregular kanji usage");
    ENTITY_MAP.put("&id;", "idiomatic expression");
    ENTITY_MAP.put("&ik;", "word containing irregular kana usage");
    ENTITY_MAP.put("&int;", "interjection (kandoushi)");
    ENTITY_MAP.put("&io;", "irregular okurigana usage");
    ENTITY_MAP.put("&iv;", "irregular verb");
    ENTITY_MAP.put("&ling;", "linguistics terminology");
    ENTITY_MAP.put("&m-sl;", "manga slang");
    ENTITY_MAP.put("&male;", "male term or language");
    ENTITY_MAP.put("&male-sl;", "male slang");
    ENTITY_MAP.put("&math;", "mathematics");
    ENTITY_MAP.put("&mil;", "military");
    ENTITY_MAP.put("&n;", "noun (common) (futsuumeishi)");
    ENTITY_MAP.put("&n-adv;", "adverbial noun (fukushitekimeishi)");
    ENTITY_MAP.put("&n-suf;", "noun, used as a suffix");
    ENTITY_MAP.put("&n-pref;", "noun, used as a prefix");
    ENTITY_MAP.put("&n-t;", "noun (temporal) (jisoumeishi)");
    ENTITY_MAP.put("&num;", "numeric");
    ENTITY_MAP.put("&oK;", "word containing out-dated kanji");
    ENTITY_MAP.put("&obs;", "obsolete term");
    ENTITY_MAP.put("&obsc;", "obscure term");
    ENTITY_MAP.put("&ok;", "out-dated or obsolete kana usage");
    ENTITY_MAP.put("&oik;", "old or irregular kana form");
    ENTITY_MAP.put("&on-mim;", "onomatopoeic or mimetic word");
    ENTITY_MAP.put("&pn;", "pronoun");
    ENTITY_MAP.put("&poet;", "poetical term");
    ENTITY_MAP.put("&pol;", "polite (teineigo) language");
    ENTITY_MAP.put("&pref;", "prefix");
    ENTITY_MAP.put("&proverb;", "proverb");
    ENTITY_MAP.put("&prt;", "particle");
    ENTITY_MAP.put("&physics;", "physics terminology");
    ENTITY_MAP.put("&rare;", "rare");
    ENTITY_MAP.put("&sens;", "sensitive");
    ENTITY_MAP.put("&sl;", "slang");
    ENTITY_MAP.put("&suf;", "suffix");
    ENTITY_MAP.put("&uK;", "word usually written using kanji alone");
    ENTITY_MAP.put("&uk;", "word usually written using kana alone");
    ENTITY_MAP.put("&unc;", "unclassified");
    ENTITY_MAP.put("&yoji;", "yojijukugo");
    ENTITY_MAP.put("&v1;", "Ichidan verb");
    ENTITY_MAP.put("&v1-s;", "Ichidan verb - kureru special class");
    ENTITY_MAP.put("&v2a-s;", "Nidan verb with 'u' ending (archaic)");
    ENTITY_MAP.put("&v4h;", "Yodan verb with `hu/fu' ending (archaic)");
    ENTITY_MAP.put("&v4r;", "Yodan verb with `ru' ending (archaic)");
    ENTITY_MAP.put("&v5aru;", "Godan verb - -aru special class");
    ENTITY_MAP.put("&v5b;", "Godan verb with `bu' ending");
    ENTITY_MAP.put("&v5g;", "Godan verb with `gu' ending");
    ENTITY_MAP.put("&v5k;", "Godan verb with `ku' ending");
    ENTITY_MAP.put("&v5k-s;", "Godan verb - Iku/Yuku special class");
    ENTITY_MAP.put("&v5m;", "Godan verb with `mu' ending");
    ENTITY_MAP.put("&v5n;", "Godan verb with `nu' ending");
    ENTITY_MAP.put("&v5r;", "Godan verb with `ru' ending");
    ENTITY_MAP.put("&v5r-i;", "Godan verb with `ru' ending (irregular verb)");
    ENTITY_MAP.put("&v5s;", "Godan verb with `su' ending");
    ENTITY_MAP.put("&v5t;", "Godan verb with `tsu' ending");
    ENTITY_MAP.put("&v5u;", "Godan verb with `u' ending");
    ENTITY_MAP.put("&v5u-s;", "Godan verb with `u' ending (special class)");
    ENTITY_MAP.put("&v5uru;", "Godan verb - Uru old class verb (old form of Eru)");
    ENTITY_MAP.put("&vz;", "Ichidan verb - zuru verb (alternative form of -jiru verbs)");
    ENTITY_MAP.put("&vi;", "intransitive verb");
    ENTITY_MAP.put("&vk;", "Kuru verb - special class");
    ENTITY_MAP.put("&vn;", "irregular nu verb");
    ENTITY_MAP.put("&vr;", "irregular ru verb, plain form ends with -ri");
    ENTITY_MAP.put("&vs;", "noun or participle which takes the aux. verb suru");
    ENTITY_MAP.put("&vs-c;", "su verb - precursor to the modern suru");
    ENTITY_MAP.put("&vs-s;", "suru verb - special class");
    ENTITY_MAP.put("&vs-i;", "suru verb - irregular");
    ENTITY_MAP.put("&kyb;", "Kyoto-ben");
    ENTITY_MAP.put("&osb;", "Osaka-ben");
    ENTITY_MAP.put("&ksb;", "Kansai-ben");
    ENTITY_MAP.put("&ktb;", "Kantou-ben");
    ENTITY_MAP.put("&tsb;", "Tosa-ben");
    ENTITY_MAP.put("&thb;", "Touhoku-ben");
    ENTITY_MAP.put("&tsug;", "Tsugaru-ben");
    ENTITY_MAP.put("&kyu;", "Kyuushuu-ben");
    ENTITY_MAP.put("&rkb;", "Ryuukyuu-ben");
    ENTITY_MAP.put("&nab;", "Nagano-ben");
    ENTITY_MAP.put("&hob;", "Hokkaido-ben");
    ENTITY_MAP.put("&vt;", "transitive verb");
    ENTITY_MAP.put("&vulg;", "vulgar expression or word");
    ENTITY_MAP.put("&adj-kari;", "`kari' adjective (archaic)");
    ENTITY_MAP.put("&adj-ku;", "`ku' adjective (archaic)");
    ENTITY_MAP.put("&adj-shiku;", "`shiku' adjective (archaic)");
    ENTITY_MAP.put("&adj-nari;", "archaic/formal form of na-adjective");
    ENTITY_MAP.put("&n-pr;", "proper noun");
    ENTITY_MAP.put("&v-unspec;", "verb unspecified");
    ENTITY_MAP.put("&v4k;", "Yodan verb with `ku' ending (archaic)");
    ENTITY_MAP.put("&v4g;", "Yodan verb with `gu' ending (archaic)");
    ENTITY_MAP.put("&v4s;", "Yodan verb with `su' ending (archaic)");
    ENTITY_MAP.put("&v4t;", "Yodan verb with `tsu' ending (archaic)");
    ENTITY_MAP.put("&v4n;", "Yodan verb with `nu' ending (archaic)");
    ENTITY_MAP.put("&v4b;", "Yodan verb with `bu' ending (archaic)");
    ENTITY_MAP.put("&v4m;", "Yodan verb with `mu' ending (archaic)");
    ENTITY_MAP.put("&v2k-k;", "Nidan verb (upper class) with `ku' ending (archaic)");
    ENTITY_MAP.put("&v2g-k;", "Nidan verb (upper class) with `gu' ending (archaic)");
    ENTITY_MAP.put("&v2t-k;", "Nidan verb (upper class) with `tsu' ending (archaic)");
    ENTITY_MAP.put("&v2d-k;", "Nidan verb (upper class) with `dzu' ending (archaic)");
    ENTITY_MAP.put("&v2h-k;", "Nidan verb (upper class) with `hu/fu' ending (archaic)");
    ENTITY_MAP.put("&v2b-k;", "Nidan verb (upper class) with `bu' ending (archaic)");
    ENTITY_MAP.put("&v2m-k;", "Nidan verb (upper class) with `mu' ending (archaic)");
    ENTITY_MAP.put("&v2y-k;", "Nidan verb (upper class) with `yu' ending (archaic)");
    ENTITY_MAP.put("&v2r-k;", "Nidan verb (upper class) with `ru' ending (archaic)");
    ENTITY_MAP.put("&v2k-s;", "Nidan verb (lower class) with `ku' ending (archaic)");
    ENTITY_MAP.put("&v2g-s;", "Nidan verb (lower class) with `gu' ending (archaic)");
    ENTITY_MAP.put("&v2s-s;", "Nidan verb (lower class) with `su' ending (archaic)");
    ENTITY_MAP.put("&v2z-s;", "Nidan verb (lower class) with `zu' ending (archaic)");
    ENTITY_MAP.put("&v2t-s;", "Nidan verb (lower class) with `tsu' ending (archaic)");
    ENTITY_MAP.put("&v2d-s;", "Nidan verb (lower class) with `dzu' ending (archaic)");
    ENTITY_MAP.put("&v2n-s;", "Nidan verb (lower class) with `nu' ending (archaic)");
    ENTITY_MAP.put("&v2h-s;", "Nidan verb (lower class) with `hu/fu' ending (archaic)");
    ENTITY_MAP.put("&v2b-s;", "Nidan verb (lower class) with `bu' ending (archaic)");
    ENTITY_MAP.put("&v2m-s;", "Nidan verb (lower class) with `mu' ending (archaic)");
    ENTITY_MAP.put("&v2y-s;", "Nidan verb (lower class) with `yu' ending (archaic)");
    ENTITY_MAP.put("&v2r-s;", "Nidan verb (lower class) with `ru' ending (archaic)");
    ENTITY_MAP.put("&v2w-s;", "Nidan verb (lower class) with `u' ending and `we' conjugation (archaic)");
    ENTITY_MAP.put("&archit;", "architecture term");
    ENTITY_MAP.put("&astron;", "astronomy, etc. term");
    ENTITY_MAP.put("&baseb;", "baseball term");
    ENTITY_MAP.put("&biol;", "biology term");
    ENTITY_MAP.put("&bot;", "botany term");
    ENTITY_MAP.put("&bus;", "business term");
    ENTITY_MAP.put("&econ;", "economics term");
    ENTITY_MAP.put("&engr;", "engineering term");
    ENTITY_MAP.put("&finc;", "finance term");
    ENTITY_MAP.put("&geol;", "geology, etc. term");
    ENTITY_MAP.put("&law;", "law, etc. term");
    ENTITY_MAP.put("&mahj;", "mahjong term");
    ENTITY_MAP.put("&med;", "medicine, etc. term");
    ENTITY_MAP.put("&music;", "music term");
    ENTITY_MAP.put("&Shinto;", "Shinto term");
    ENTITY_MAP.put("&shogi;", "shogi term");
    ENTITY_MAP.put("&sports;", "sports term");
    ENTITY_MAP.put("&sumo;", "sumo term");
    ENTITY_MAP.put("&zool;", "zoology term");
    ENTITY_MAP.put("&joc;", "jocular, humorous term");
    ENTITY_MAP.put("&anat;", "anatomical term");


    ENTITY_MAP.put("&sK;", "search-only kanji form.");
    ENTITY_MAP.put("&rK;", "Rarely-used kanji form");
    ENTITY_MAP.put("&euph;", "Euphemistic (mild or indirect expression used to soften a harsh meaning)");
    ENTITY_MAP.put("&sk;", "search-only kana form.");
    ENTITY_MAP.put("&rk;", "Rarely-used kana form");
    ENTITY_MAP.put("&hist;", "historical term");

  }

  public static String replaceEntities(String xml) {
    // First, replace known valid entities using the ENTITY_MAP
    for (Map.Entry<String, String> entry : ENTITY_MAP.entrySet()) {
      xml = xml.replace(entry.getKey(), entry.getValue());
    }

    xml = xml.replaceAll("&", "{").replaceAll(";", "}");

    return xml;
  }

  static Set<String> entitiesFound = new HashSet<>();
  public static void finder(String xml){
    Pattern pattern = Pattern.compile("&([a-zA-Z0-9-]+);");
    Matcher matcher = pattern.matcher(xml);

    while (matcher.find()) {
      entitiesFound.add(matcher.group(1));
    }
    System.out.println("Entities found: " + entitiesFound);
  }
}
