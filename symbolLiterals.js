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
var QUOTES = "'"+'"';
var STRINGESCAPE = "\\";
var EOFMaxRead = 10000;
var DBCharPosAtStartEmit = 0;

function read(){
  if (streamPos < stream.length) {
    look = stream[streamPos];
    streamPos = streamPos + 1;
  } else {
    EOF = true;
    look = "";
    if (!EOFMaxRead--) abort("ABORTED: Stuck in loop.. ");
  }
}
function getChar(){
  read();
}
function error(s){
  console.log("Error@char " + (streamPos-1)+ " : " + s  );
  setTextareaSelection(DBCharPosAtStartEmit, streamPos);
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
function isLineComment(c){ //cheeky lookahead
  return (c == "/") && ("/" == stream[streamPos]);
}
function isBlockComment(c){ //cheeky lookahead
  return (c == "/") && ("*" == stream[streamPos]);
}
function isEndOfLineOrFile(c){
  return (c == CR) || (c == LF) || EOF;
}
function isRegExLiteral(c){ //**NB: just catches the breaking expressions /\/\//g; & /a\/*abc()/gi
  var isRegExpTell = (streamPos>1) && (STRINGESCAPE == stream[streamPos-2]);
  var isRegExpDoubleSlash = isLineComment(c) && isRegExpTell;
  var isRegExpSlashStar = isBlockComment(c) && isRegExpTell;
  return isRegExpDoubleSlash || isRegExpSlashStar;
}
function emit(s){
  result += s;
}
function emitAndGetChar(s){
  emit(s);
  getChar();
}
function emitRegExLiteral(){    //regex's posing as comments.. do while not / where / is not preceeded by \ or \\\ or \\\\\ etc       or  ;
  if (isLineComment(look)){    //      /\//g;
    emitAndGetChar(look); 
    emitAndGetChar(look);
  } else if (isBlockComment(look)) {    //      /a\/*/g
    emitAndGetChar(look);
    while (look != "/" && STRINGESCAPE == stream[streamPos-2] && !EOF) {
      emitAndGetChar(look);
    }
    emitAndGetChar(look);
  }
  while ("igm".indexOf(look) != -1) {
    emitAndGetChar(look);
  }
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
  if (look != thisStringsTerminator) abort("String Literal Error: End of line or file: expecting string terminator");
  emitAndGetChar(look);
}
function emitBlockComment(){
  emitAndGetChar(look);
  while (!(look == "/" && "*" == stream[streamPos-2]) && !EOF) {
    emitAndGetChar(look);
  }
  emitAndGetChar(look);
}
function emitLineComment(){
  while (!isEndOfLineOrFile(look)) {
    emitAndGetChar(look);
  }
  emitAndGetChar(look);
}
function init(){
  result = "";
  EOF = false;
  EOFMaxRead = 1000;
  DBCharPosAtStartEmit = 0;
  getChar();
}
function replaceSymbolLiterals(){
  switch (true) {
    case isRegExLiteral(look):
      emitRegExLiteral();
      break;
    case isLineComment(look):
      emitLineComment();
      break;
    case isBlockComment(look):
      emitBlockComment();
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
  init();
  while (!EOF){
    DBCharPosAtStartEmit = streamPos-1;
    replaceSymbolLiterals();
  }
  return result;
}