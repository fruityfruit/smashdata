/*var treeData = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (theData);*/

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 0},
    width = 1560 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

    d3.json("data/data.json").then(function(theData) {
      var treeData = d3.stratify()
          .id(function(d) { return d.name; })
          .parentId(function(d) { return d.parent; })
          (theData);

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([width, height]);

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function(d) { return d.children; });
root.x0 = 0;
root.y0 = width/2;

root.marker = "i00";

function collapse(d, index) {
d.parent = this;
d.marker = this.marker + generateMarker(index);
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse, d);
    d.children = null;
  }
}


//
function flatten(root) {
  var nodes = [],
    i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (node._children) node._children.forEach(recurse);
    if (!node.id) node.id = ++i;
    //console.log(node);
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}
function doReset(){
    flatten(root).forEach(function(d) {
      d.color = undefined;
    })
    update(root);
}
var select = d3.select("#search-area")
  .append("select")
  .on("change", function() {
    var select = d3.select("select").node().value;
    if (select == "Select"){
          doReset();
          return;
    }
    var filtered = flatten(root).filter(function(d){
      return d.data.data.winner == select;
    });

    doReset()
    var find = filtered.forEach(function(d){
      while(d.parent)
      {
        d.color = "red";
        d = d.parent;
      }
      update(root)
    });
  });


select.append("option")
  .attr("value", "Select")
  .attr("selected", "true")
  .text("Select");
var nodeList = treeData.descendants();
var nodeTrack = [];
nodeList.forEach(function(d) {
  if(nodeTrack.includes(d.data.winner))
    {return;}
  nodeTrack.push(d.data.winner)
  select.append("option")
    .attr("value", d.data.id)
    .text(d.data.winner);
});
d3.select("#search-area").append("button")
  .text("Reset").on("click", function(){
    d3.select("select").node().value = "Select";
    doReset();
  });
//


//root.children.forEach(collapse, root);
update(root);


function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 180});

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.x0 + "," + source.y0 + ")";
    })
    .on('click', click)
    .on("mouseover", function(d) {
      var g = d3.select(this); // The node
      // The class is used to remove the additional text later
      var info = g.append('text')
         .classed('info', true)
         .attr('x', 20)
         .attr('y', 35)
         .text(function(d) {return "Winner " + d.data.data.winner;});
  })
  .on("mouseout", function() {
      // Remove the info text on mouse out.
      d3.select(this).select('text.info').remove()
    });

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 0.5)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });
      var images = nodeEnter.append("svg:image")
            .attr("xlink:href",  function(d) { return d.data.data.image;})
            .attr("x", function(d) { return -25;})
            .attr("y", function(d) { return -25;})
            .attr("height", 50)
            .attr("width", 50);

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("dx", 12)
      .attr("x", function(d) {
          return d.children || d._children ? -35 : 10;
      })
      .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
          //console.log(d.data.data.name)
          return d.data.data.name; });

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 0.5)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {y: source.y0, x: source.x0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  d3.selectAll("path").style("stroke", function(d) {
      if (d.color) {
        return d.color
      } else {
        return "gray"
      }
    });

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.x} ${s.y}
            C ${(s.x + d.x) / 2} ${s.y},
              ${(s.x + d.x) / 2} ${d.y},
              ${d.x} ${d.y}`

    return path
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    update(d);
  }
}
});
