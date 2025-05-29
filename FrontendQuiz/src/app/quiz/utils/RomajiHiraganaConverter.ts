export class RomajiHiraganaConverter {
  static romajiToJapanese(romaji: string | undefined): string {
    if (!romaji || romaji == "") {
      console.log("romaji was empty");
      return "";
    }

    let currentAlphabet = "hiragana";
    let hiraganaIsCurrent = true;
    let resultString = "";

    let i = 0;
    while (i < romaji.length) {

      //checks if the alphabet should be switched
      if (romaji[i] == "*") {
        if (hiraganaIsCurrent) {
          currentAlphabet = "katakana";
          hiraganaIsCurrent = false;
        } else {
          currentAlphabet = "hiragana";
          hiraganaIsCurrent = true;
        }
        i++;

        //checks wa rule
      } else if (romaji[i] == " ") {
        if (i + 3 < romaji.length && romaji.substring(i, i + 4) == "wa") {
          resultString += " " + (currentAlphabet == "hiragana" ? this.hiragana["ha"] : this.katakana["ha"]) + " ";
          i += 4;
          continue;
        }
        resultString += " ";
        i++;

        // n rule
      } else if (
        i + 2 < romaji.length && romaji[i] == "n" && romaji.substring(i + 1, i + 2) == "n" &&
        (currentAlphabet == "hiragana" && !(romaji.substring(i + 1, i + 3) in this.hiragana)) ||
        (currentAlphabet == "katakana" && !(romaji.substring(i + 1, i + 3) in this.katakana))
      ) {
        resultString += currentAlphabet == "hiragana" ? this.hiragana.sakuon : this.katakana.sakuon;
        i++;




      } else {
        if(!romaji)
          return "";

        let checkLen = Math.min(3, romaji.length - i);
        while (checkLen > 0) {
          let checkStr = romaji.substring(i, i + checkLen);

          if ((currentAlphabet == "hiragana" && checkStr in this.hiragana)
            || (currentAlphabet == "katakana" && checkStr in this.katakana)) {
            resultString += currentAlphabet == "hiragana" ? this.getHiragana(checkStr) : this.getKatakana(checkStr);
            i += checkLen;

            if (i < romaji.length) {
              if (romaji[i] == "o" && romaji.substring(i - 1, 1) == "o" && currentAlphabet == "hiragana") {
                resultString += currentAlphabet == "hiragana" ? this.hiragana.u : this.katakana.u;
                i++;
              } else if (romaji[i] == "e" && romaji.substring(i - 1, 1) == "e" && currentAlphabet == "hiragana") {
                resultString += currentAlphabet == "hiragana" ? this.hiragana.i : this.katakana.i;
                i++;
              } else if (romaji[i] == romaji.substring(i - 1, 1) && currentAlphabet == "katakana") {
                if (romaji[i] == romaji.substring(i - 1, i) && currentAlphabet == "katakana") {
                  if (romaji[i] == "n") {
                    break;
                  } else if (["a", "e", "i", "o", "u"].includes(romaji[i])) {
                    resultString += this.katakana.pause;
                  } else {
                    resultString += this.katakana.sakuon;
                  }
                  i++;
                }
              }
            }
            break;
          } else if (checkLen == 1) {
            if (["?", ".", "!"].includes(checkStr)) {
              resultString += "。";
            } else if (!(this.alphabet.includes(checkStr))) {
              resultString += checkStr;
            } else if (i + 1 < romaji.length) {
              if (checkStr == romaji.substring(i + 1, i + 2)) {
                resultString += currentAlphabet == "hiragana" ? this.hiragana.sakuon : this.katakana.sakuon;
              }
            }
            i++;
            break;
          }
          checkLen -= 1;
        }
      }

    }
    return resultString;
  }

  static  getHiragana(key: string): string {
    switch (key) {
      case "a":
        return this.hiragana.a;
      case "i":
        return this.hiragana.i;
      case "u":
        return this.hiragana.u;
      case "e":
        return this.hiragana.e;
      case "o":
        return this.hiragana.o;

      case "ka":
        return this.hiragana.ka;
      case "ki":
        return this.hiragana.ki;
      case "ku":
        return this.hiragana.ku;
      case "ke":
        return this.hiragana.ke;
      case "ko":
        return this.hiragana.ko;

      case "ga":
        return this.hiragana.ga;
      case "gi":
        return this.hiragana.gi;
      case "gu":
        return this.hiragana.gu;
      case "ge":
        return this.hiragana.ge;
      case "go":
        return this.hiragana.go;

      case "sa":
        return this.hiragana.sa;
      case "shi":
        return this.hiragana.shi;
      case "su":
        return this.hiragana.su;
      case "se":
        return this.hiragana.se;
      case "so":
        return this.hiragana.so;

      case "za":
        return this.hiragana.za;
      case "ji":
        return this.hiragana.ji;
      case "zu":
        return this.hiragana.zu;
      case "ze":
        return this.hiragana.ze;
      case "zo":
        return this.hiragana.zo;

      case "ta":
        return this.hiragana.ta;
      case "chi":
        return this.hiragana.chi;
      case "tsu":
        return this.hiragana.tsu;
      case "te":
        return this.hiragana.te;
      case "to":
        return this.hiragana.to;

      case "da":
        return this.hiragana.da;
      case "du":
        return this.hiragana.du;
      case "de":
        return this.hiragana.de;
      case "do":
        return this.hiragana.do;

      case "na":
        return this.hiragana.na;
      case "ni":
        return this.hiragana.ni;
      case "nu":
        return this.hiragana.nu;
      case "ne":
        return this.hiragana.ne;
      case "no":
        return this.hiragana.no;

      case "ha":
        return this.hiragana.ha;
      case "hi":
        return this.hiragana.hi;
      case "fu":
        return this.hiragana.fu;
      case "he":
        return this.hiragana.he;
      case "ho":
        return this.hiragana.ho;

      case "ba":
        return this.hiragana.ba;
      case "bi":
        return this.hiragana.bi;
      case "bu":
        return this.hiragana.bu;
      case "be":
        return this.hiragana.be;
      case "bo":
        return this.hiragana.bo;

      case "pa":
        return this.hiragana.pa;
      case "pi":
        return this.hiragana.pi;
      case "pu":
        return this.hiragana.pu;
      case "pe":
        return this.hiragana.pe;
      case "po":
        return this.hiragana.po;

      case "ma":
        return this.hiragana.ma;
      case "mi":
        return this.hiragana.mi;
      case "mu":
        return this.hiragana.mu;
      case "me":
        return this.hiragana.me;
      case "mo":
        return this.hiragana.mo;

      case "ya":
        return this.hiragana.ya;
      case "yu":
        return this.hiragana.yu;
      case "yo":
        return this.hiragana.yo;

      case "ra":
        return this.hiragana.ra;
      case "ri":
        return this.hiragana.ri;
      case "ru":
        return this.hiragana.ru;
      case "re":
        return this.hiragana.re;
      case "ro":
        return this.hiragana.ro;

      case "wa":
        return this.hiragana.wa;
      case "wo":
        return this.hiragana.wo;

      case "n":
        return this.hiragana.n;

      case "kya":
        return this.hiragana.kya;
      case "kyu":
        return this.hiragana.kyu;
      case "kyo":
        return this.hiragana.kyo;
      case "gya":
        return this.hiragana.gya;
      case "gyu":
        return this.hiragana.gyu;
      case "gyo":
        return this.hiragana.gyo;
      case "sha":
        return this.hiragana.sha;
      case "shu":
        return this.hiragana.shu;
      case "sho":
        return this.hiragana.sho;
      case "ja":
        return this.hiragana.ja;
      case "ju":
        return this.hiragana.ju;
      case "jo":
        return this.hiragana.jo;
      case "cha":
        return this.hiragana.cha;
      case "chu":
        return this.hiragana.chu;
      case "cho":
        return this.hiragana.cho;
      case "nya":
        return this.hiragana.nya;
      case "nyu":
        return this.hiragana.nyu;
      case "nyo":
        return this.hiragana.nyo;
      case "hya":
        return this.hiragana.hya;
      case "hyu":
        return this.hiragana.hyu;
      case "hyo":
        return this.hiragana.hyo;
      case "bya":
        return this.hiragana.bya;
      case "byu":
        return this.hiragana.byu;
      case "byo":
        return this.hiragana.byo;
      case "pya":
        return this.hiragana.pya;
      case "pyu":
        return this.hiragana.pyu;
      case "pyo":
        return this.hiragana.pyo;
      case "mya":
        return this.hiragana.mya;
      case "myu":
        return this.hiragana.myu;
      case "myo":
        return this.hiragana.myo;
      case "rya":
        return this.hiragana.rya;
      case "ryu":
        return this.hiragana.ryu;
      case "ryo":
        return this.hiragana.ryo;
      case "vu":
        return this.hiragana.vu;
      case "sakuon":
        return this.hiragana.sakuon;
    }
    return "";
  }

  static hiragana = {
    "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
    "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
    "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
    "sa": "さ", "shi": "し", "su": "す", "se": "せ", "so": "そ",
    "za": "ざ", "ji": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
    "ta": "た", "chi": "ち", "tsu": "つ", "te": "て", "to": "と",
    "da": "だ", "du": "づ", "de": "で", "do": "ど",
    "na": "な", "ni": "に", "ne": "ね", "nu": "ぬ", "no": "の",
    "ha": "は", "hi": "ひ", "fu": "ふ", "he": "へ", "ho": "ほ",
    "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
    "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
    "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
    "ya": "や", "yu": "ゆ", "yo": "よ",
    "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
    "wa": "わ", "wo": "を",
    "n": "ん",
    "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
    "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
    "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
    "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
    "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
    "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
    "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
    "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
    "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ",
    "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
    "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
    "vu": "う",
    "sakuon": "っ"
  }

  static katakana = {
    "a": "ア", "i": "イ", "u": "ウ", "e": "エ", "o": "オ",
    "ka": "カ", "ki": "キ", "ku": "ク", "ke": "ケ", "ko": "コ",
    "ga": "ガ", "gi": "ギ", "gu": "グ", "ge": "ゲ", "go": "ゴ",
    "sa": "サ", "shi": "シ", "su": "ス", "se": "セ", "so": "ソ",
    "za": "ザ", "ji": "ジ", "zu": "ズ", "ze": "ゼ", "zo": "ゾ",
    "ta": "タ", "chi": "チ", "tsu": "ツ", "te": "テ", "to": "ト",
    "da": "ダ", "du": "ヅ", "de": "デ", "do": "ド",
    "na": "ナ", "ni": "ニ", "ne": "ネ", "nu": "ヌ", "no": "ノ",
    "ha": "ハ", "hi": "ヒ", "fu": "フ", "he": "ヘ", "ho": "ホ",
    "ba": "バ", "bi": "ビ", "bu": "ブ", "be": "ベ", "bo": "ボ",
    "pa": "パ", "pi": "ピ", "pu": "プ", "pe": "ペ", "po": "ポ",
    "ma": "マ", "mi": "ミ", "mu": "ム", "me": "メ", "mo": "モ",
    "ya": "ヤ", "yu": "ユ", "yo": "ヨ",
    "ra": "ラ", "ri": "リ", "ru": "ル", "re": "レ", "ro": "ロ",
    "wa": "ワ", "wo": "ヲ",
    "n": "ン",
    "kya": "キャ", "kyu": "キュ", "kyo": "キョ",
    "gya": "ギャ", "gyu": "ぎゅ", "gyo": "ギョ",
    "sha": "シャ", "shu": "シュ", "sho": "ショ",
    "ja": "ジャ", "ju": "ジュ", "jo": "ジョ",
    "cha": "チャ", "chu": "チュ", "cho": "チョ",
    "nya": "ニャ", "nyu": "ニュ", "nyo": "ニョ",
    "hya": "ヒャ", "hyu": "ヒュ", "hyo": "ヒョ",
    "bya": "ビャ", "byu": "ビュ", "byo": "ビョ",
    "pya": "ピャ", "pyu": "ピュ", "pyo": "ピョ",
    "mya": "ミャ", "myu": "ミュ", "myo": "ミョ",
    "rya": "リャ", "ryu": "リュ", "ryo": "リョ",
    "vu": "ウ",
    "va": "ヴァ", "vi": "ヴィ", "ve": "ヴェ", "vo": "ヴォ",
    "wi": "ウィ", "we": "ウェ",
    "fa": "ファ", "fi": "フィ", "fe": "フェ", "fo": "フォ",
    "che": "チェ",
    "di": "ヂ", "dou": "ドウ",
    "ti": "チ", "tu": "ツ",
    "je": "ジェ",
    "she": "シェ",
    "sakuon": "ッ",
    "pause": "ー"//use ß
  }

  static getKatakana(key: string): string {
    switch (key) {
      case "a":
        return this.katakana.a;
      case "i":
        return this.katakana.i;
      case "u":
        return this.katakana.u;
      case "e":
        return this.katakana.e;
      case "o":
        return this.katakana.o;

      case "ka":
        return this.katakana.ka;
      case "ki":
        return this.katakana.ki;
      case "ku":
        return this.katakana.ku;
      case "ke":
        return this.katakana.ke;
      case "ko":
        return this.katakana.ko;

      case "ga":
        return this.katakana.ga;
      case "gi":
        return this.katakana.gi;
      case "gu":
        return this.katakana.gu;
      case "ge":
        return this.katakana.ge;
      case "go":
        return this.katakana.go;

      case "sa":
        return this.katakana.sa;
      case "shi":
        return this.katakana.shi;
      case "su":
        return this.katakana.su;
      case "se":
        return this.katakana.se;
      case "so":
        return this.katakana.so;

      case "za":
        return this.katakana.za;
      case "ji":
        return this.katakana.ji;
      case "zu":
        return this.katakana.zu;
      case "ze":
        return this.katakana.ze;
      case "zo":
        return this.katakana.zo;

      case "ta":
        return this.katakana.ta;
      case "chi":
        return this.katakana.chi;
      case "tsu":
        return this.katakana.tsu;
      case "te":
        return this.katakana.te;
      case "to":
        return this.katakana.to;

      case "da":
        return this.katakana.da;
      case "du":
        return this.katakana.du;
      case "de":
        return this.katakana.de;
      case "do":
        return this.katakana.do;

      case "na":
        return this.katakana.na;
      case "ni":
        return this.katakana.ni;
      case "nu":
        return this.katakana.nu;
      case "ne":
        return this.katakana.ne;
      case "no":
        return this.katakana.no;

      case "ha":
        return this.katakana.ha;
      case "hi":
        return this.katakana.hi;
      case "fu":
        return this.katakana.fu;
      case "he":
        return this.katakana.ge;
      case "ho":
        return this.katakana.ho;

      case "ba":
        return this.katakana.ba;
      case "bi":
        return this.katakana.bi;
      case "bu":
        return this.katakana.bu;
      case "be":
        return this.katakana.be;
      case "bo":
        return this.katakana.bo;

      case "pa":
        return this.katakana.pa;
      case "pi":
        return this.katakana.pi;
      case "pu":
        return this.katakana.pu;
      case "pe":
        return this.katakana.pe;
      case "po":
        return this.katakana.po;

      case "ma":
        return this.katakana.ma;
      case "mi":
        return this.katakana.mi;
      case "mu":
        return this.katakana.mu;
      case "me":
        return this.katakana.me;
      case "mo":
        return this.katakana.mo;

      case "ya":
        return this.katakana.ya;
      case "yu":
        return this.katakana.yu;
      case "yo":
        return this.katakana.yo;

      case "ra":
        return this.katakana.ra;
      case "ri":
        return this.katakana.ri;
      case "ru":
        return this.katakana.ru;
      case "re":
        return this.katakana.re;
      case "ro":
        return this.katakana.ro;

      case "wa":
        return this.katakana.wa;
      case "wo":
        return this.katakana.wo;

      case "n":
        return this.katakana.n;

      case "kya":
        return this.katakana.kya;
      case "kyu":
        return this.katakana.kyu;
      case "kyo":
        return this.katakana.kyo;
      case "gya":
        return this.katakana.gya;
      case "gyu":
        return this.katakana.gyu;
      case "gyo":
        return this.katakana.gyo;
      case "sha":
        return this.katakana.sha;
      case "shu":
        return this.katakana.shu;
      case "sho":
        return this.katakana.sho;
      case "ja":
        return this.katakana.ja;
      case "ju":
        return this.katakana.ju;
      case "jo":
        return this.katakana.jo;
      case "cha":
        return this.katakana.cha;
      case "chu":
        return this.katakana.chu;
      case "cho":
        return this.katakana.cho;
      case "nya":
        return this.katakana.nya;
      case "nyu":
        return this.katakana.nyu;
      case "nyo":
        return this.katakana.nyo;
      case "hya":
        return this.katakana.hya;
      case "hyu":
        return this.katakana.hyu;
      case "hyo":
        return this.katakana.hyo;
      case "bya":
        return this.katakana.bya;
      case "byu":
        return this.katakana.byu;
      case "byo":
        return this.katakana.byo;
      case "pya":
        return this.katakana.pya;
      case "pyu":
        return this.katakana.pyu;
      case "pyo":
        return this.katakana.pyo;
      case "mya":
        return this.katakana.mya;
      case "myu":
        return this.katakana.myu;
      case "myo":
        return this.katakana.myo;
      case "rya":
        return this.katakana.rya;
      case "ryu":
        return this.katakana.ryu;
      case "ryo":
        return this.katakana.ryo;
      case "va":
        return this.katakana.va;
      case "vi":
        return this.katakana.vi;
      case "vu":
        return this.katakana.vu;
      case "ve":
        return this.katakana.ve;
      case "vo":
        return this.katakana.vo;
      case "wi":
        return this.katakana.wi;
      case "we":
        return this.katakana.we;
      case "fa":
        return this.katakana.fa;
      case "fi":
        return this.katakana.fi;
      case "fe":
        return this.katakana.fe;
      case "fo":
        return this.katakana.fo;
      case "che":
        return this.katakana.che;
      case "di":
        return this.katakana.di;
      case "ti":
        return this.katakana.ti;
      case "tu":
        return this.katakana.tu;
      case "je":
        return this.katakana.je;
      case "she":
        return this.katakana.she;
      case "pause":
        return this.katakana.pause;
      case "sakuon":
        return this.katakana.sakuon;
    }
    return "";
  }

  static alphabet = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
}
