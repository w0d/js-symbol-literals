# js-symbol-literals
Extend javascript with symbol literals

when symbol use is heavy - code gets peppered with lots of 
  Symbol.for('mySymbolName')
  
borrowing from Lingo's symbol literals, you can type instead
  #mySymbolName

calling main(scriptext) will convert all occurances of symbol literals eg #symbolName to valid javascript Symbol.for('symbolName')

currently experimental as needs much testing, particularly of javascript with heavy use of regular expression literals
