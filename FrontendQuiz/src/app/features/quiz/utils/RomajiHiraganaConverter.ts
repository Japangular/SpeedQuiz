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

  static getHiragana(key: string): string {
    return (this.hiragana as Record<string, string>)[key] ?? "";
  }

  static getKatakana(key: string): string {
    return (this.katakana as Record<string, string>)[key] ?? "";
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

  static alphabet = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
}
