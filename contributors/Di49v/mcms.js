// Cyber Node Network Simulation
(function () {
  const W = 640;
  const H = 420;

  let sketch = function (p) {
    let nodes = [];
    const numNodes = 80;
    const connectionDistance = 110;

    function isLight() {
      return document.documentElement.getAttribute("data-theme") === "light";
    }

    p.setup = function () {
      const holder = document.getElementById("mcmc-canvas-wrap");
      const canvas = p.createCanvas(W, H);
      if (holder) canvas.parent(holder);
      
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: p.random(W),
          y: p.random(H),
          vx: p.random(-1.5, 1.5),
          vy: p.random(-1.5, 1.5),
          radius: p.random(2, 4.5)
        });
      }

      const pulseBtn = document.getElementById("mcmc-reset");
      if (pulseBtn) {
        pulseBtn.addEventListener("click", () => {
          nodes.forEach(node => {
            node.vx *= 3;
            node.vy *= 3;
          });
        });
      }
    };

    p.draw = function () {
      const light = isLight();
      if (light) p.background(255, 250, 243);
      else p.background(8, 8, 8);

      let strokeColor = light ? [62, 242, 161] : [165, 109, 255]; 
      let nodeColor = light ? [230, 83, 140] : [62, 242, 161];

      for (let i = 0; i < nodes.length; i++) {
        let n1 = nodes[i];

        n1.x += n1.vx;
        n1.y += n1.vy;

        // Gentle speed decay if they got pulsed
        let speed = p.sqrt(n1.vx * n1.vx + n1.vy * n1.vy);
        if (speed > 2) {
          n1.vx *= 0.98;
          n1.vy *= 0.98;
        } else if (speed < 0.5) {
           n1.vx *= 1.05;
           n1.vy *= 1.05;
        }

        // Bounce off edges
        if (n1.x < 0 || n1.x > W) n1.vx *= -1;
        if (n1.y < 0 || n1.y > H) n1.vy *= -1;

        // Mouse repulsion
        let mouseDist = p.dist(n1.x, n1.y, p.mouseX, p.mouseY);
        if (mouseDist < 100 && p.mouseX > 0 && p.mouseX < W && p.mouseY > 0 && p.mouseY < H) {
           let forceX = (n1.x - p.mouseX) * 0.03;
           let forceY = (n1.y - p.mouseY) * 0.03;
           n1.vx += forceX;
           n1.vy += forceY;
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          let n2 = nodes[j];
          let d = p.dist(n1.x, n1.y, n2.x, n2.y);
          if (d < connectionDistance) {
            let alpha = p.map(d, 0, connectionDistance, 180, 0);
            p.stroke(strokeColor[0], strokeColor[1], strokeColor[2], alpha);
            p.strokeWeight(1.2);
            p.line(n1.x, n1.y, n2.x, n2.y);
          }
        }

        // Draw node
        p.noStroke();
        p.fill(nodeColor[0], nodeColor[1], nodeColor[2], 200);
        p.circle(n1.x, n1.y, n1.radius * 2);
      }
    };
  };

  new p5(sketch);
})();