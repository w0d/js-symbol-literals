// transpile javascript containing symbol literals, #mySymbolName, to valid javascript => Symbol.for('mySymbolName')
// USE: main(scriptText); returns valid javascript
// Caution advised if you use regex literals..

var stream;
var streamPos;
var result = "";
var look;
var EOF = false;
var CR = "\r";
var LF = "\n";
var QUOTES = "\'"+'\"';
var STRINGESCAPE = "\\";
var EOFMaxRead = 1000;

function read(){
  if (streamPos < stream.length) {
    look = stream[streamPos];
    streamPos = streamPos + 1;
    if (streamPos >= stream.length){
      EOF = true;
    }
  } else {
    look = "";
    if (!EOFMaxRead--) abort("ABORTED: Stuck in loop..");
  }
}
function getChar(){
  read();
}
function error(s){
  console.log("Error@char " + (streamPos-1)+ " : " + s  );
}
function abort(s){ 
  error(s);
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
function isEndOfLineOrFile(c){
  return (c == CR) || (c == LF) || EOF;
}
function isRegExLiteral(c){ //**NB: just catches the breaking expressions /\/\//g; & /a\/*abc()/gi
  var isRegExpTell = (streamPos>1) && (STRINGESCAPE == stream[streamPos-2]);  //(streamPos>1) for when script begins with // or /*
  var isRegExpDoubleSlash = isSingleLineComment(c) && isRegExpTell;
  var isRegExpSlashStar = isMultiLineComment(c) && isRegExpTell;
  return isRegExpDoubleSlash || isRegExpSlashStar;
}
function emit(s){
  result += s;
}
function emitAndGetChar(s){
  emit(s);
  getChar();
}
function emitRegExLiteral(c){
//do while not / where / is not preceeded by \ or \\\ or \\\\\ etc          /\//g; or  /a\/*/g;
  if (isSingleLineComment(c) && (streamPos>1) && (STRINGESCAPE == stream[streamPos-2])){
    emitAndGetChar(look);
  } else if (isMultiLineComment(c) && (streamPos>1) && (STRINGESCAPE == stream[streamPos-2])) {
    while ((look != "/" && STRINGESCAPE != stream[streamPos-1]) || !EOF) {
      emitAndGetChar(look);
    }
  } else {
    console.log('u aint seen me..');
  }
  emitAndGetChar(look);
}
function emitSymbolLiteral(){
  match('#');
  emit( "Symbol.for('" );
  if (!isAlpha(look)) expected('Symbol literal name');
  while (isAlNum(look)) {
    emitAndGetChar( look );
  }
  emit("')");
}
function emitStringLiteral(){
  var thisStringsTerminator = matchOne(QUOTES);
  emit(thisStringsTerminator);
  while (look != thisStringsTerminator && !isEndOfLineOrFile(look)) {
    if (look == STRINGESCAPE) {   //skip next char as well
      emitAndGetChar(look);
    }
    emitAndGetChar(look);
  }
  if (look != thisStringsTerminator) error("String Literal Error: End of line or file: expecting string terminator");
  emitAndGetChar(look);
}
function emitMultiLineComment(){
  while ((look != "/" && "*" != stream[streamPos-1]) || EOF) {
    emitAndGetChar(look);
  }
  emitAndGetChar(look);
}
function emitSingleLineComment(){
  while (!isEndOfLineOrFile(look)) {
    emitAndGetChar(look);
  }
  emitAndGetChar(look);
}
function init(){
  result = "";
  EOF = false;
  getChar();
}
function replaceSymbolLiterals(){
  switch (true) {
    case isRegExLiteral(look):
      emitRegExLiteral();
      break;
    case isSingleLineComment(look):
      emitSingleLineComment();
      break;
    case isMultiLineComment(look):
      emitMultiLineComment();
      break;
    case isQuote(look):
      emitStringLiteral();
      break;
    case isHash(look):
      emitSymbolLiteral();
      break;
    default:
      emitAndGetChar(look);
  }
}
function main(parseStr){
  stream = parseStr;
  streamPos = 0;
  EOFMaxRead = 1000;
  init();
  while (!EOF){
    replaceSymbolLiterals();
  }
  return result;
}