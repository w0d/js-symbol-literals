// transpile javascript containing symbol literals, #mySymbolName, to valid javascript => Symbol.for('mySymbolName')
// USE: main(scriptText);
//  

var stream;
var streamPos;
var result = "";
var look;

var EOF = false;
var CR = "\r";

var QUOTES = "'\"";
var COMMENT = "/";
var COMMENT = "/*";

function read(){
  if (streamPos < stream.length) {
    look = stream[streamPos];
    streamPos = streamPos + 1;
  } else {
    EOF = true;
    look = "";
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
  return ~"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c);
}

function isDigit(c){
  return ~"1234567890".indexOf(c);
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
  var ret;
  ret = matchOne(QUOTES);
  while (look != ret[0] && !EOF) {    //EOF check required for scripts with a lonely quote
    ret += look;
    if (look=="\\") {
      getChar();
      ret += look;
    }
    getChar();
  }
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
    } while (look != '*' && !EOF);
    ret += look;
    getChar();
  } while (look != '/' && !EOF);
  ret += look;
  getChar();
  return ret;
}

function getSingleLineComment(){
  var ret = '';
  while (look != CR && !EOF) {
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

function main(parseStr){
  stream = parseStr;
  streamPos = 0;
  init();
  while (!EOF){
    replaceSymbolLiterals();
  }
  console.log(result);
  return result;
}

function replaceSymbolLiterals(){
  switch (true) {
    case isSingleLineComment(look):
      emit( getSingleLineComment() );
      break;
    case isMultiLineComment(look):
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
























