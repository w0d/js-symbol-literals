// transpile javascript containing symbol literals, #mySymbolName, to valid javascript => Symbol.for('mySymbolName')
// USE: main(scriptText);
//  

var stream;
var streamPos;
var look;

var result = "";
var EOF = false;

var QUOTES = "'\"";

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
   return ~'\'"'.indexOf(c);
}

function isHash(c){
   return c == "#";
}

function getSymbolLiteral(){
  var s = '';
  match('#');
  if (!isAlpha(look)) expected('Symbol literal');
  while (isAlNum(look)) {
    s = s + look;
    getChar();
  }
  return s;
}

//**2DO   handle \' & \"
function getStringLiteral(){
  var s;
  s = matchOne(QUOTES);
  while (look != s[0] && !EOF) {
    s = s + look;
    if (look=="\\") {
      getChar();
      s = s + look;
    }
    getChar();
  }
  s = s + look;
  getChar();
  return s;
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
  streamPos = 0;
  stream = parseStr;
  init();
  while (!EOF){
    replaceSymbolLiterals();
  }
  console.log(result);
  return result;
}

function replaceSymbolLiterals(){
  if (isQuote(look)){
    emit( getStringLiteral() );
  } else if (isHash(look)) {
    emit( "Symbol.for('"+getSymbolLiteral()+"')" );
  } else {
    emit( look );
    getChar();
  }
}
























