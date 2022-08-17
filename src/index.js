import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback
} from "react";
import ReactDOM from "react-dom";
import { Grid, Row } from "react-flexbox-grid";
import ForceGraph2D from "react-force-graph-2d";

const data = {
  nodes: [
    {
      id: "1",
      isClusterNode: true,
      name: "Planets",
      val: 50,
      color: "red"
    },
    {
      id: "2",
      color: "red",
      val: 1,
      name: "Mars"
    },
    {
      id: "3",
      color: "red",
      name: "Venus"
    },
    {
      id: "10",
      color: "red",
      name: "Neptune"
    },
    {
      id: "4",
      isClusterNode: true,
      val: 70,
      name: "Animal"
    },
    {
      id: "5",
      name: "Tiger"
    },
    {
      id: "6",
      name: "Dog"
    },
    {
      id: "7",
      name: "Wolf"
    },
    {
      id: "8",
      name: "Elephant"
    },
    {
      id: "9",
      name: "Cat"
    },
    {
      id: "11",
      name: "Plant",
      isClusterNode: true,
      color: "yellow",
      val: 30
    },
    {
      id: "12",
      name: "Tree",
      color: "yellow"
    },
    {
      id: "13",
      name: "Flower",
      color: "yellow"
    }
  ],
  links: [
    { source: "1", target: "2" },
    { source: "1", target: "3" },
    { source: "1", target: "10" },
    { source: "4", target: "5" },
    { source: "4", target: "6" },
    { source: "4", target: "7" },
    { source: "4", target: "8" },
    { source: "4", target: "9" },
    { source: "11", target: "12" },
    { source: "11", target: "13" }
  ]
};

const App = () => {
  const [hiddenClusters, setHiddenClusters] = useState([]);
  const forceRef = useRef();
  useEffect(() => {
    forceRef.current.d3Force("charge").strength(-15);
    forceRef.current.d3Force("charge").distanceMax(80);
    forceRef.current.d3Force("link").distance(50);
  });

  const nodesById = useMemo(() => {
    const nodesById = Object.fromEntries(
      data.nodes.map((node) => [node.id, node])
    );

    // link parent/children
    data.nodes.forEach((node) => {
      node.collapsed = true;
      node.childLinks = [];
    });
    data.links.forEach((link) => nodesById[link.source].childLinks.push(link));

    return nodesById;
  }, []);

  const getPrunedTree = useCallback(() => {
    const visibleNodes = [];
    const visibleLinks = [];
    const traverseTree = (node) => {
      visibleNodes.push(node);
      if (node.collapsed) return;
      visibleLinks.push(...node.childLinks);
      node.childLinks
        .map((link) =>
          typeof link.target === "object" ? link.target : nodesById[link.target]
        ) // get child node
        .forEach(traverseTree);
    };
    console.log(hiddenClusters);
    data.nodes
      .filter((node) => node.isClusterNode && !hiddenClusters.includes(node.id))
      .forEach((node) => traverseTree(node));

    return { nodes: visibleNodes, links: visibleLinks };
  }, [nodesById, hiddenClusters]);

  const [prunedTree, setPrunedTree] = useState(getPrunedTree());

  const handleNodeClick = useCallback(
    (node) => {
      node.collapsed = !node.collapsed; // toggle collapse state
      setPrunedTree(getPrunedTree());
    },
    [getPrunedTree]
  );
  const toggleCluster = (clusterId) => {
    if (hiddenClusters.includes(clusterId)) {
      setHiddenClusters(hiddenClusters.filter((id) => id !== clusterId));
    } else {
      setHiddenClusters([...hiddenClusters, clusterId]);
    }
  };

  useEffect(() => {
    setPrunedTree(getPrunedTree());
  }, [hiddenClusters, getPrunedTree]);

  return (
    <Grid>
      <Row>
        <button
          onClick={() => {
            toggleCluster("4");
          }}
        >
          Hide/show animals
        </button>
        <button
          onClick={() => {
            toggleCluster("11");
          }}
        >
          Hide/show plants
        </button>
        <button
          onClick={() => {
            toggleCluster("1");
          }}
        >
          Hide/show planets
        </button>
      </Row>
      <ForceGraph2D
        width={800}
        height={600}
        backgroundColor="lightgray"
        ref={forceRef}
        onNodeClick={handleNodeClick}
        graphData={prunedTree}
        nodeAutoColorBy="group"
        nodeCanvasObjectMode={() => "after"}
        cooldownTicks={100}
        onEngineStop={() => forceRef.current.zoomToFit(400)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "black"; //node.color;
          if (node.isClusterNode) {
            ctx.fillText(label, node.x, node.y);
          } else {
            ctx.fillText(label, node.x + 16, node.y);
          }
        }}
      />
    </Grid>
  );
};

ReactDOM.render(<App />, document.getElementById("container"));
