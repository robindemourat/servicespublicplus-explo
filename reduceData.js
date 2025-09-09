const fs = require('fs');

import('d3-dsv')
  .then(dsv => {
    let input = fs.readFileSync('inputs/export-experiences.csv', 'utf8');
    input = dsv.dsvFormat(";").parse(input);
    const keep = [
      'ID expérience',
      'Etat expérience',
      'Date de publication',
      'Titre',
      'Description',
      'Posté comme	Ressenti usager',
      'Intitulé département usager',
      'Intitulé Typologie 1',
      'Canaux Typologie 1',
      'Intitulé structure 1',
      'Statut réponse structure 1',
      'Réponse structure 1',
      'Expériences Similaires',
      'Amélioration de service à considérer',
    ];
    const smallData = input.map(
      (datum) =>
        keep.reduce(
          (obj, key) => ({ ...obj, [key]: datum[key] })
          , {}));
    fs.writeFileSync('outputs/slimservicespublicplus.csv', dsv.csvFormat(smallData), 'utf8')
  })