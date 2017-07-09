'use strict';

const AhoCorasick = require('node-aho-corasick');
const createTrie = require("array-trie");
const createAC = require("aho-corasick-automaton");
// const utilities = {};


var annotateMe = function (server, partIds) {

  // const Part = server.plugins['hapi-mongo-models'].Part;
  // const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  console.log("hello");
  //arr or some other object

  var trie = createTrie()
  trie.set([1,2,3], 1)
  trie.set([2,3,4], 2)
  trie.set([6,7,8], 3)
  trie.set([1,2], 4)
  trie.set([2,3], 5)


  var automata = createAC(trie)

  //var ac = new AhoCorasick();
  //var partIds = ['1234','34567','7890'];
  //for each partId:



  var data = [1,2,3,4,5,6,7,8,9]
  for(var state=automata, i=0; i<data.length; ) {

    //Process next symbol
    state=state.push(data[i++])

    //Print out all matches at position i
    if(state.value !== undefined) {
      console.log("matches at position", i, ":")
      for(var cur = state; cur.value !== undefined; cur = cur.next) {
        console.log(cur.value)
      }
    }
  }


  // for (var i = 0; i < partIds.length; ++i) {
  //
  //   //get bioDesign --> get part --> get sequence
  //   // var subSubPart = Part.findByBioDesignId(partIds[i]);
  //   // var subSequence = Sequence.findByPartId(subSubPart["_id"]);
  //   // var sequence = subSequence["sequence"];
  //   //add sequence to array/object
  //
  //   ac.add(partIds[i]);
  //
  // }
  //apply aho-Corasick algorithm to arr (eliminates overlaps)
  //ac.build();
  //next steps --> see what is returned
  //var res = ac.search('12321'); --> test this out

  // console.log(ac.build());
  // console.log(ac);
  // console.log(ac.search('123456789'));
  // console.log('after build');
  //for each result from a mapping of the aC algorithm:

      //each result returns the part
      //get the corresponding sequence --> cSeq

      //for each annotation in part.sequence.annotation:
          //check if annotation.feature.sequence == cSeq
          //if yes, make a constant == that feature


      //if feature != null:
          //create a new annotation (subAnnotation --> linked to deviceSequence)
          //with the start/end lengths from the aC algorithm
          //update superAnnotationId in feature

  // return (ac.search('1234567890'));



};


module.exports.annotateMe = annotateMe;
