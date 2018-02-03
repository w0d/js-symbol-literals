// transpile javascript containing symbol literals, #mySymbolName, to valid javascript => Symbol.for('mySymbolName')
// USE: main(scriptText); returns valid javascript
//  

var stream;
var streamPos;
var result = "";
var look;
var EOF = false;

var CR = "\r";
var LF = "\n";
var QUOTES = "\'"+'\"';
var STRINGESCAPE = "\\";

function read(){
  if (streamPos < stream.length) {
    look = stream[streamPos];
    streamPos = streamPos + 1;
  } else {
    EOF = true;
    look = "";
  }
  if (streamPos == 146493){
    look = look;
  }
}

function getChar(){
  read();
}

function error(s){
  console.log("Error: " + s + ".");
}

function abort(s){ 
  error(s);
  console.log("ERROR at char "+(streamPos-1));
  throw new Error(s);
}

function expected(s){
  abort(s + " Expected");
}

function match(c){
  if (look == c) getChar();
  else expected("'" + c + "'");
}

function matchOne(c){
  for (var i=0; i<c.length; i++){
    if (look == c[i]) {
      getChar();
      return c[i];
    }
  }
  expected("'One of " + c + "'");
}

function isAlpha(c){
  var charCode = c.charCodeAt(0);
  return (charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123);
}

function isDigit(c){
  var charCode = c.charCodeAt(0);
  return (charCode > 47 && charCode < 58);
}

function isAlNum(c) {
  return isAlpha(c) || isDigit(c);
}

function isQuote(c){
  return "'" == c || '"' == c;
}

function isHash(c){
  return c == "#";
}

function isSingleLineComment(c){ //cheeky lookahead
  return (c == "/") && ("/" == stream[streamPos]);
}

function isMultiLineComment(c){ //cheeky lookahead
  return (c == "/") && ("*" == stream[streamPos]);
}

function isEndOfLine(c){
  return (c == CR) || (c == LF);
}

function getRegularExpressionLiteral(){

}

function getSymbolLiteral(){
  var ret = '';
  match('#');
  if (!isAlpha(look)) expected('Symbol literal name');
  while (isAlNum(look)) {
    ret += look;
    getChar();
  }
  return ret;
}

function getStringLiteral(){
  var ret = matchOne(QUOTES);
  while (look != ret[0] && !EOF && !isEndOfLine(look)) {    //EOF check required for scripts with a lonely quote
    ret += look;
    if (look == STRINGESCAPE) {   //skip next char as well
      getChar();
      ret += look;
    }
    getChar();
  }
  if (isEndOfLine(look)) console.log("String Literal Error: End of line before string terminator")
  ret += look;
  getChar();
  return ret;
}

function getMultiLineComment(){
  var ret = '';
  do {
    do {
      ret += look;
      getChar();
    } while (look != '*' && !EOF);    //EOF check required for scripts with unterminated comment
    ret += look;
    getChar();
  } while (look != '/' && !EOF);
  ret += look;
  getChar();
  return ret;
}

function getSingleLineComment(){
  var ret = '';
  while (!isEndOfLine(look) && !EOF) {    //EOF check required for scripts with comment on last line
    ret += look;
    getChar();
  }
  ret += look;
  getChar();
  return ret;
}

function emit(s){
  result += s;
}

function init(){
  result = "";
  EOF = false;
  getChar();
}

function replaceSymbolLiterals(){
  if (look=="#"){
    look == look;
  }
  switch (true) {
    case isSingleLineComment(look):
console.log("single comment");
      emit( getSingleLineComment() );
      break;
    case isMultiLineComment(look):
console.log("multi comment");
      emit( getMultiLineComment() );
      break;
    case isQuote(look):
      emit( getStringLiteral() );
      break;
    case isHash(look):
      emit( "Symbol.for('"+getSymbolLiteral()+"')" );
      break;
    default:
      emit( look );
      getChar();
  }
}

function main(parseStr){
  stream = parseStr;
  streamPos = 0;
  init();
  while (!EOF){
    replaceSymbolLiterals();
  }
  return result;
}