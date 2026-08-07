// Multi-Agent Boids Simulation
// Renders an interactive flock of agents that align, cohere, and separate.

(function () {
  const W = 640;
  const H = 420;

  let sketch = function (p) {
    let flock = [];
    let isScattering = false;

    function isLight() {
      return document.documentElement.getAttribute("data-theme") === "light";
    }

    p.setup = function () {
      // Connect to the original mcmc-canvas-wrap ID
      const holder = document.getElementById("mcmc-canvas-wrap");
      const canvas = p.createCanvas(W, H);
      if (holder) canvas.parent(holder);
      
      for (let i = 0; i < 75; i++) {
        flock.push(new Boid());
      }

      // Connect to the original mcmc-reset button ID
      const scatterBtn = document.getElementById("mcmc-reset");
      if (scatterBtn) {
        scatterBtn.addEventListener("click", () => triggerScatter(W/2, H/2));
      }

      canvas.mousePressed(() => {
        triggerScatter(p.mouseX, p.mouseY);
      });
    };

    function triggerScatter(x, y) {
      isScattering = true;
      setTimeout(() => isScattering = false, 800);
      for (let boid of flock) {
        let push = p.createVector(boid.position.x - x, boid.position.y - y);
        push.normalize();
        push.mult(15);
        boid.applyForce(push);
      }
    }

    p.draw = function () {
      const light = isLight();
      if (light) p.background(255, 250, 243);
      else p.background(8, 8, 8);

      for (let boid of flock) {
        boid.edges();
        boid.flock(flock, isScattering);
        boid.update();
        boid.show(light);
      }
    };

    class Boid {
      constructor() {
        this.position = p.createVector(p.random(W), p.random(H));
        let angle = p.random(p.TWO_PI);
        this.velocity = p.createVector(p.cos(angle), p.sin(angle));
        this.velocity.setMag(p.random(2, 4));
        this.acceleration = p.createVector();
        this.maxForce = 0.2;
        this.maxSpeed = 4;
      }

      edges() {
        if (this.position.x > W + 10) this.position.x = -10;
        else if (this.position.x < -10) this.position.x = W + 10;
        if (this.position.y > H + 10) this.position.y = -10;
        else if (this.position.y < -10) this.position.y = H + 10;
      }

      align(boids) {
        let perceptionRadius = 50;
        let steering = p.createVector();
        let total = 0;
        for (let other of boids) {
          let d = p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
          if (other != this && d < perceptionRadius) {
            steering.add(other.velocity);
            total++;
          }
        }
        if (total > 0) {
          steering.div(total);
          steering.setMag(this.maxSpeed);
          steering.sub(this.velocity);
          steering.limit(this.maxForce);
        }
        return steering;
      }

      cohesion(boids) {
        let perceptionRadius = 50;
        let steering = p.createVector();
        let total = 0;
        for (let other of boids) {
          let d = p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
          if (other != this && d < perceptionRadius) {
            steering.add(other.position);
            total++;
          }
        }
        if (total > 0) {
          steering.div(total);
          steering.sub(this.position);
          steering.setMag(this.maxSpeed);
          steering.sub(this.velocity);
          steering.limit(this.maxForce);
        }
        return steering;
      }

      separation(boids) {
        let perceptionRadius = 24;
        let steering = p.createVector();
        let total = 0;
        for (let other of boids) {
          let d = p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
          if (other != this && d < perceptionRadius) {
            let diff = p.createVector(this.position.x - other.position.x, this.position.y - other.position.y);
            diff.div(d * d);
            steering.add(diff);
            total++;
          }
        }
        if (total > 0) {
          steering.div(total);
          steering.setMag(this.maxSpeed);
          steering.sub(this.velocity);
          steering.limit(this.maxForce);
        }
        return steering;
      }

      flock(boids, scatter) {
        if (scatter) return; 
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        
        separation.mult(1.5);
        this.applyForce(separation);
      }

      applyForce(force) {
        this.acceleration.add(force);
      }

      update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
      }

      show(light) {
        p.strokeWeight(6);
        if (light) {
          p.stroke(62, 242, 161, 200); 
        } else {
          p.stroke(165, 109, 255, 200);
        }
        
        let theta = this.velocity.heading() + p.PI / 2;
        p.push();
        p.translate(this.position.x, this.position.y);
        p.rotate(theta);
        p.beginShape();
        p.vertex(0, -10);
        p.vertex(-6, 6);
        p.vertex(6, 6);
        p.endShape(p.CLOSE);
        p.pop();
      }
    }
  };

  new p5(sketch);
})();