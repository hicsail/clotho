'use strict';

const Part = server.plugins['hapi-mongo-models'].Part;
const Sequence = server.plugins['hapi-mongo-models'].Sequence;

const AhoCorasick = require('node-aho-corasick');

const utilities = {};


utilities.annotateMe = function (sequence, partIds) {

  //arr or some other object
  var ac = new AhoCorasick();

  //for each partId:
  for (var i = 0; i < partIds.length; ++i) {

    //get bioDesign --> get part --> get sequence
    var subSubPart = Part.findByBioDesignId(partIds[i]);
    var subSequence = Sequence.findByPartId(subSubPart["_id"]);
    var sequence = subSequence["sequence"];
    //add sequence to array/object

    ac.add(sequence);

  }
  //apply aho-Corasick algorithm to arr (eliminates overlaps)
  ac.build();
  //next steps --> see what is returned
  //var res = ac.search('12321'); --> test this out


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





};


exports.register.attributes = {
  name: 'utilities'
};
