const fs = require('fs');

let structuresSeules = new Set()
const simplifyStructure = val => {
  let simp;
  const acronymes = [ 'DRAAF', 'DREAL', 'ADEME', 'France connect', 'URSSAF', 'CROUS', 'Anact'];
  const aliases = {
    'CPAM': 'assurance maladie', 
    'CNAM': 'assurance maladie',
    'DTPN': 'police & gendarmerie',
    'DIPN' : 'police & gendarmerie',
    'gendarmerie': 'police & gendarmerie',
    'police': 'police & gendarmerie',
    'BOT ': 'police & gendarmerie',
    'BPCO ': 'police & gendarmerie',
    'DDPN': 'police & gendarmerie',
    'Plainte en ligne (PEL)': 'police & gendarmerie',
    'PHAROS': 'police & gendarmerie',
    'THESEE': 'police & gendarmerie',

    'ANTS': 'France Titres',
    'France Titres': 'France Titres',

    'CAF': 'caisses d\'allocations familiales',
    'CNAF': 'caisses d\'allocations familiales',
    'CAISSE NATIONALE DES ALLOCATIONS FAMILIALES': 'caisses d\'allocations familiales',

    'douane': 'douanes',

    'SIP': 'services des impôts',
    'Service des Impôts': 'services des impôts',
    'impôts': 'services des impôts',
    'SGC': 'services des impôts',
    'finances publiques': 'services des impôts',
    'Paierie départementale': 'services des impôts',
    'Impots.gouv.fr': 'services des impôts',

    'Trésorerie amendes': 'trésoreries amendes',

    'Ambassade': 'consulats et ambassades',
    'Consulat': 'consulats et ambassades',
    'France Consulaire': 'consulats et ambassades',

    'Bureau Français': 'consulats et ambassades',
    'CARSAT': 'CARSAT et caisses de retraites',
    'AGIRC-ARRCO': 'CARSAT et caisses de retraites',
    'retraitesdeletat.gouv.fr': 'CARSAT et caisses de retraites',
    'Agence retraite': 'CARSAT et caisses de retraites',
    'Assurance retraite': 'CARSAT et caisses de retraites',
    'Retraite': 'CARSAT et caisses de retraites',

    'CNOUS': 'CROUS',
    

    'Tribunal': 'justice & pénitentiaire',
    'Cour d\'Appel': 'justice & pénitentiaire',
    'Cour de Cassation': 'justice & pénitentiaire',
    'Direction de l\'administration pénitentiaire': 'justice & pénitentiaire',
    'Maison d\'arrêt': 'justice & pénitentiaire',
    'justice': 'justice & pénitentiaire',
    'Centre pénitentiaire': 'justice & pénitentiaire',
    'Centre de détention': 'justice & pénitentiaire',
    'services pénitentiaires': 'justice & pénitentiaire',
    'judiciaire': 'justice & pénitentiaire',
    'Conseil de Prud\'hommes': 'justice & pénitentiaire',
    'Conseil départemental de l\'accès au droit': 'justice & pénitentiaire',

    'Centre du service national et de la jeunesse' : 'Centre du service national et de la jeunesse',
    'SDCLR': 'Office national des combattants et victimes de guerre',

    'Direction départementale': 'collectivités',
    'Collectivités territoriales': 'collectivités',
    'Ville': 'collectivités',
    'Service départemental': 'collectivités',
    'Secrétariat général commun': 'collectivités',
    'Direction interrégionale': 'collectivités',
    'MUNICIPALE': 'collectivités',

    'préfecture': 'préfectures',
    'prefecture': 'préfectures',
    'MI-ATE': 'préfectures',

    'MSA': 'sécurité sociale',
    'CAISSE NATIONALE MILITAIRE DE SECURITE SOCIALE': 'sécurité sociale',
    'Caisse de Sécurité Sociale': 'sécurité sociale',

    'Ecole': 'enseignement',
    'Collège': 'enseignement',
    'Lycée': 'enseignement',
    'Université': 'enseignement',
    'RECTORAT': 'enseignement',
    'DSDEN' :'enseignement',

    'Archives': 'archives',
    'Bibliothèque nationale de France': 'archives',


    'France Travail': 'France Travail',

    'Musée': 'établissements culturels',
    'Bibliothèque': 'établissements culturels',
    'Théâtre': 'établissements culturels',
    'Comédie Française': 'établissements culturels',
    'La Cinémathèque française': 'établissements culturels',
    'Palais de Tokyo': 'établissements culturels',
    'Pass Culture': 'établissements culturels',

    'Trésorerie hospitalière': 'hopitaux',
    'Trésorerie HOSPITALIERE': 'hopitaux',
    'HOPITAUX': 'hopitaux',

    'Service de publicité foncière': 'Service de publicité foncière',

    'Ministère de ': 'ministères et autres agences nationales',
    'Direction interministérielle': 'ministères et autres agences nationales',
    'agence': 'ministères et autres agences nationales',

  }
  simp = acronymes.find(accr => val.toLowerCase().includes(accr.toLowerCase()));
  if (!simp) {
    Object.entries(aliases).forEach(([accr, label]) => {
      if (val.toLowerCase().includes(accr.toLowerCase())) {
        simp = label
      }
    })
  }
  if (!simp) {
    // console.log('pas attribué : ', val);
    structuresSeules.add(val);
    return 'autres';
  }
  return simp;
}

import('d3-dsv')
  .then(dsv => {
    // chargement du fichier en csv
    let input = fs.readFileSync('inputs/export-experiences.csv', 'utf8');
    // nettoyage des retours chariots
    input = input.split('\n').reduce((res, line, i) => {
      if (i > 1 && (line.match(/^([^;]+)$/gm) || !line.match(/^(\d+)/))) {
        return res + '|' + line.trim();
      }
      return res + '\n' + line.trim();
    }, '').trim();
    input = dsv.dsvFormat(";").parse(input);

    const clusters = dsv.csvParse(fs.readFileSync('inputs/Cluster clean Cortexte.csv', 'utf8'));
    const problemes = dsv.tsvParse(fs.readFileSync('inputs/LLM_Extraction_Problemes_Services_Publics_Conforme.csv', 'utf8'));

    const clustersMap = new Map();
    const problemsMap = new Map();
    clusters.forEach(({ID_exprien,PC_ITFull1}) => clustersMap.set(ID_exprien,PC_ITFull1))

    problemes.forEach(({ID, Problème, Contexte}) => {
      const item = {probleme: Problème, contexte: Contexte};
      if (!problemsMap.get(ID)) {
        problemsMap.set(ID, [item])
      } else {
        const existing = problemsMap.get(ID);
        problemsMap.set(ID, [...existing, item])
      }
    })
    // const inputJSON = fs.readFileSync('inputs/export-experiences.json', 'utf8').trim();
    // const cleanJSON = inputJSON.split('\n')
    // .map((line, i) => {
    //   if (i >= 50000 && i%50000 === 0) {
    //     // delete last char
    //     return line.substring(0, line.length - 2) + ',';
    //   } else if (i >= 50000 && i%50000 === 1) {
    //     // delete first char
    //     console.log('test: ', line.substring(1))
    //     return line.substring(1);
    //   }
    //   return line
    // })
    // .join('\n')
    // const input = JSON.parse(cleanJSON)

    const inputCleanCsv = dsv.csvFormat(input);
    fs.writeFileSync(`outputs/input-clean.csv`, inputCleanCsv, 'utf8');
    const inputEnriched = input.map(item => {
      const outputItem = {...item}
      const id = item['ID expérience']
      if (clustersMap.get(id)) {
        outputItem.cluster = clustersMap.get(id);
      }
      if (problemsMap.get(id)) {
        const pbs = problemsMap.get(id);
        outputItem.problemes = pbs.map(p => p.probleme);
        outputItem.problemes_avec_contextes = pbs.map(({probleme, contexte}) => `${probleme} (${contexte})`)
      }
      outputItem['type de structure'] = simplifyStructure(item['Intitulé structure 1'])
      return outputItem;
    });
    console.log('structures seules');
    console.log(Array.from(structuresSeules).sort().join('\n'));
    console.log('=======> %s structures non-catégorisées', Array.from(structuresSeules).length);
    fs.writeFileSync(`outputs/input-clean-enriched.csv`, dsv.csvFormat(inputEnriched), 'utf8');
    fs.writeFileSync(`outputs/input-clean-clusters-only.csv`, dsv.csvFormat(
      inputEnriched.filter(d => d.cluster)
    ), 'utf8');
    console.log('%s expériences de base', input.length);
    console.log('%s expériences  négatives', input.filter(d => d['Ressenti usager'] === 'Négatif').length);
    const baseFilter = inputEnriched.filter(d => {
      const respIA = ['1', '2', '3'].find(n => d[`Taux de similarité réponse IA structure ${n}`] !== '' && +d[`Taux de similarité réponse IA structure ${n}`] >= 50);
      const neg = d['Ressenti usager'] === 'Négatif';
      return respIA && neg;
    });
    console.log('%s expériences négatives avec plus de 50% d\'utilisation de l\'IA', baseFilter.length);
    console.log('%s expériences négatives avec plus de 50% d\'utilisation de l\'IA et +1000 caractères', baseFilter.filter(d =>  d['Description'].length > 1000).length);
    console.log('%s expériences négatives avec plus de 50% d\'utilisation de l\'IA et +2000 caractères', baseFilter.filter(d =>  d['Description'].length > 2000).length);

    // let nbAvecRespIa = 0;
    const iaResponses = input.reduce((res, d) => {
      // let hasIt = false;
      ['1', '2', '3']
        .forEach(n => {

          const respIA = d[`Taux de similarité réponse IA structure ${n}`] !== '' && +d[`Taux de similarité réponse IA structure ${n}`] >= 50;
          if (respIA) {
            hasIt = true;
            const respText = d[`Réponse structure ${n}`];
            const item = {
              text: respText,
              structure: d[`Intitulé structure ${n}`]
            };
            res.push(item)
          }
        });
      // if (hasIt && d['Ressenti usager'] === 'Négatif') {
      //   nbAvecRespIa++;
      // }
      return res;
    }, []);
    // console.log('nb resp avec ia', nbAvecRespIa, input.length);
    const sets = [
      // {
      //   fileName: 'respIA',
      //   title: 'Réponses d\'IA sûr à 100%',
      //   data: input.filter(d => d['Taux de similarité réponse IA structure 1'] === '100')
      // },

      {
        fileName: 'baseFilter',
        title: 'Réponse IA>50%, exp négative',
        data: baseFilter
      },
      {
        fileName: 'min1000',
        title: 'Réponse IA>50%, exp négative, plus de 1000 caractères',
        data: baseFilter.filter(d => d['Description'].length > 1000)
      },
      {
        fileName: 'min2000',
        title: 'Réponse IA>50%, exp négative, plus de 2000 caractères',
        data: baseFilter.filter(d => d['Description'].length > 2000)
      },
      {
        fileName: 'min2000_au_moins_un_acronyme',
        title: 'Réponse IA>50%, exp négative, plus de 2000 caractères, au moins un acronyme',
        data: baseFilter.filter(d => d['Description'].length > 2000 && d['Description'].match(/\b[A-Z]{3,20}\b/))
      },
      {
        fileName: 'min1000plrs_structures',
        title: 'Réponse IA>50%, exp négative, plus de 1000 caractères, plusieurs structures impliquées',
        data: baseFilter
          .filter(d => d['Description'].length > 1000)
          .filter(d => {
            const keyBase = 'Intitulé structure';
            const nbNotEmpty = [1, 2, 3].filter(n => d[`${keyBase} ${n}`]).length;
            // if(d['Intitulé structure 2']) {
            //   console.log('ok', d['Intitulé structure 2'], nbNotEmpty)
            // }
            return nbNotEmpty > 1;
          })
          .sort((a, b) => {
            if (a['Description'].length > b['Description'].length) {
              return -1;
            }
            return 1;
          })
      },
      // {
      //   fileName: 'romans',
      //   title: 'Les 200 réponses les plus longues (pour comparaison)',
      //   data: input
      //   .sort((a, b) => {
      //     if (a['Description'].length > b['Description'].length) {
      //       return -1;
      //     }
      //     return 1;
      //   })
      //   .slice(0, 200)
      // }
    ];
    sets.forEach(({ fileName, data, title }) => {
      const outputHTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title} – Fiches services public plus</title>
  </head>
  <body>
<section class="page">
<h1>Retours service public plus</h1>
<ul>
<li>nom du fichier : ${fileName}</li>
<li>nombre de fiches : ${data.length}</li>
<li>description du filtre : ${title}</li>
</ul>
</section>
  ${data.map(datum => {
        return `
<section class="page">
<h1>${datum['Titre']}</h1>
<h3>${datum['Pseudonyme usager']} – le ${new Date(datum['Écrit le']).toLocaleDateString()}</h3>
<blockquote>
<p>
<strong>
${datum['Description'].replace(/\|+/gm, '<br/>')}
</strong>
</p>
</blockquote>

<ul>
${[
            { key: 'ID expérience', name: 'ID expérience' },
            { key: 'Ressenti usager', name: 'Ressenti usager' },
            { key: 'Démarches saisies par usager', name: 'Démarches saisies par usager' },
            { key: 'Intitulé département usager', name: 'Département' },
            { key: 'Accessibilité', name: 'Accessibilité' },
          ]
            .filter(({ key }) => (datum[key] || '').trim().length)
            .map(({ key, name }) => `<li><strong>${name}</strong> : <span>${datum[key]}</span></li>`)
            .join('\n')
          }
        ${[
            { key: 'Intitulé typologie', name: 'Intitulé typologie' },
            { key: 'Canaux Typologie', name: 'Canaux' },
            { key: 'Intitulé structure', name: 'Structures' },
            { key: 'Réponse structure', name: 'Réponse structure' },
            { key: 'Taux de similarité réponse IA structure', name: 'Taux de similarité réponse IA structure' },
          ]
            .map(({ key, name }) => {
              let values = ['1', '2', '3'].map(n => datum[`${key} ${n}`] || '')
                .filter(v => v.trim().length)
              values = Array.from(new Set(values)).join(', ');
              if (values.length) {
                return `<li><strong>${name}</strong> : <span>${values.replace(/\|+/gm, '<br/>')}</span></li>`
              }
              return ''
            })
            .join('\n')
          }
        
          ${[
            { key: 'Accessibilité', name: 'Accessibilité' },
            { key: 'Information/Explication', name: 'Information/Explication' },
            { key: 'Relation', name: 'Relation' },
            { key: 'Réactivité', name: 'Réactivité' },
            { key: 'Simplicité/Complexité', name: 'Simplicité/Complexité' },
          ]
            .filter(({ key }) => (datum[key] || '').trim().length)
            .map(({ key, name }) => `<li><strong>${name}</strong> : <span>${datum[key]}</span></li>`)
            .join('\n')

          }
</ul>
</section>
      `
      })
          .join('\n')
        }
<style>


section {
  page-break-after: always;
}

@page {
  size: A5 portrait;
}
</style>
  </body>
</html>`;
      fs.writeFileSync(`outputs/${fileName}.html`, outputHTML, 'utf8');
      fs.writeFileSync(`outputs/${fileName}.csv`, dsv.csvFormat(data), 'utf8');
    })
    const iaResponsesPath = 'outputs/iaResponses.html';
    const iaResponsesHTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Fiches services public plus</title>
  </head>
  <body>
  ${iaResponses.map(datum => {
      return `
<section class="page">
<p>${datum['text']}</p>
</section>
      `
    })
        .join('\n')
      }
<style>


section {
  page-break-after: always;
}

@page {
  size: A5 portrait;
}
</style>
  </body>
</html>`
    fs.writeFileSync(iaResponsesPath, iaResponsesHTML, 'utf8');


    fs.writeFileSync('outputs/résumé.txt', `Résumé des générations :
${sets.map(({ fileName, title, data }) => `* ${fileName}.csv & ${fileName}.html : ${title} (${data.length} expériences)`).join('\n')}`, 'utf8')

    console.log('done, bye');
  })