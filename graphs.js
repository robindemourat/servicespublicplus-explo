import {readFileSync, writeFileSync} from 'fs';
import Graph from 'graphology';
import gexf from 'graphology-gexf';

import('d3-dsv')
  .then(dsv => {
    const data = dsv.csvParse(readFileSync('outputs/input-clean-enriched.csv', 'utf8')).filter(id => id !== 'prompts' && id);
    // console.log(data.find(d => d.problemes));

    const problemesGraph = new Graph({type: 'undirected'});
    const problemesVsClustersGraph = new Graph({type: 'undirected'});

    const problemes = data.filter(d => d.problemes);
    const problemesAndClusters = data.filter(d => d.problemes && d.cluster);

    problemes.forEach(datum => {
      const pbs = datum.problemes.split(',').map(d => d.trim());
      // create nodes
      pbs.forEach(pb => {
        if (problemesGraph.hasNode(pb)) {
          // console.log('ok', pb);
          problemesGraph.updateNodeAttribute(pb, 'size', n => n + 1)
        } else {
          // console.log('add', pb);
          problemesGraph.addNode(pb, {size: 1, label: pb, x: Math.random(), y: Math.random()})
        }
      });
      // create edges
      if (pbs.length > 1) {
        pbs.forEach((pb1, i) => {
          pbs.slice(i).forEach(pb2 => {
            if (problemesGraph.hasEdge(pb1, pb2)) {
              problemesGraph.updateEdgeAttribute(pb1, pb2, 'weight', n => n + 1)
            } else {
              problemesGraph.addEdge(pb1, pb2, {weight: 1})
            }
          })
        })
      }
    });

    problemesAndClusters.forEach(datum => {
      const pbs = datum.problemes.split(',').map(d => d.trim());
      const cluster = datum.cluster;
      console.log('cluster', cluster);
      if (problemesVsClustersGraph.hasNode(cluster)) {
          problemesVsClustersGraph.updateNodeAttribute(cluster, 'size', n => n + 1)
      } else {
          problemesVsClustersGraph.addNode(cluster, {size: 1, color: '#C2151B', label: cluster, x: Math.random(), y: Math.random()})
      }
      // create nodes
      pbs.forEach(pb => {
        if (problemesVsClustersGraph.hasNode(pb)) {
          // console.log('ok', pb);
          problemesVsClustersGraph.updateNodeAttribute(pb, 'size', n => n + 1)
        } else {
          // console.log('add', pb);
          problemesVsClustersGraph.addNode(pb, {size: 1, color: '#2021A0', label: pb, x: Math.random(), y: Math.random()})
        }

        // create edge with cluster
        if (problemesVsClustersGraph.hasEdge(pb, cluster)) {
          problemesVsClustersGraph.updateEdgeAttribute(pb, cluster, 'weight', n => n + 1)
        } else {
          problemesVsClustersGraph.addEdge(pb, cluster, {weight: 1})
        }
      });
      // create edges
      if (pbs.length > 1) {
        pbs.forEach((pb1, i) => {
          pbs.slice(i).forEach(pb2 => {
            if (problemesVsClustersGraph.hasEdge(pb1, pb2)) {
              problemesVsClustersGraph.updateEdgeAttribute(pb1, pb2, 'weight', n => n + 1)
            } else {
              problemesVsClustersGraph.addEdge(pb1, pb2, {weight: 1})
            }
          })
        })
      }
    });

    const gexfString = gexf.write(problemesGraph);
    writeFileSync('outputs/problemesGraph.gexf', gexfString, 'utf8')
    const gexfString2 = gexf.write(problemesVsClustersGraph);
    writeFileSync('outputs/problemesVsClustersGraph.gexf', gexfString2, 'utf8')
  })