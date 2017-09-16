/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - external plugin - countdown -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.external.countdown = function(options) {
  this._mv = options.mv;
  this._screen = options.screen;
  this._random = options.mv.create('misc', 'random');
  this._rotate = 0;
  this.properties = {
  };

  // Setups effect module.
  this._effect = options.mv.create('effect', 'noise', {
			enable: ['color', 'tube', 'film']
//      disable: ['color', 'slitscan', 'noise']
  });
//  this._effect.properties.noise_level = [0.0, 0.1, 0.0];
//  this._effect.properties.noise_color = [1, 1, 0];
	this._effect.properties.color_shift = [0, 0, 0];
	this._effect.properties.color_level = [0.107, 0.074, 0.043];
	this._effect.properties.color_weight = [0.4, 0.7, 1.0];
  this._fbo = options.mv.screen().createFrameBuffer();

  // Setups 3D API interface.
  this._frame = options.mv.create('frame', 'api3d', {
    draw: this._draw.bind(this)
  });
  this._camera = options.mv.create('misc', 'camera');
  this._camera.moveTo(0, [0, 0, 100]);
  this._camera.lookAt(0, [0, 0, 0]);

  // Setups rendering primitives.
  this._sphere = TmaModelPrimitives.createSphere(
      2,
      TmaModelPrimitives.SPHERE_METHOD_EVEN,
      TmaModelPrimitives.SPHERE_FLAG_NO_TEXTURE
  );
  this._sphereVertices = this._sphere.getVertices().slice(0);

  this._stars = TmaModelPrimitives.createStars(10000, 30000);
  
  // Setups number data.
  this._patterns = [];
  const mx = 20;
  const my = 40;
  const mn = 10;
  for (let i = 0; i < 10; ++i) {
    let pattern = [];
    let data = MajVj.external.countdown._number_patterns[i];
    for (let j = 0; j < 2048; ++j) {
      const n = this._random.generate(0, data.length) | 0;
      const line = data[n];
      const x = this._random.generate(line[0], line[2]) * mx;
      const y = this._random.generate(line[1], line[3]) * my * -1.0;
      const dx = this._random.generate(-mn, mn) * this._random.generate() * this._random.generate();
      const dy = this._random.generate(-mn, mn) * this._random.generate() * this._random.generate();
      pattern.push({ sx: x, sy: y, ex: x + dx, ey: y + dy });
    }
    this._patterns.push(pattern);
  }
  
  this._number = 9;
  this._count = 0;
};

MajVj.external.countdown._number_patterns = [
  /* 0 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1] ],
  /* 1 */ [ [0, -1, 0, 1] ],
  /* 2 */ [ [-1, -1, 1, -1], [1, -1, 1, 0], [-1, 0, 1, 0], [-1, 0, -1, 1], [-1, 1, 1, 1] ],
  /* 3 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 0, 1, 0], [-1, 1, 1, 1] ],
  /* 4 */ [ [-1, -1, -1, 0], [-1, 0, 1, 0], [1, -1, 1, 1] ],
  /* 5 */ [ [-1, -1, 1, -1], [-1, -1, -1, 0], [-1, 0, 1, 0], [1, 0, 1, 1], [-1, 1, 1, 1] ],
  /* 6 */ [ [-1, -1, 1, -1], [-1, 0, 1, 0], [1, 0, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1] ],
  /* 7 */ [ [-1, -1, 1, -1], [1, -1, 1, 1] ],
  /* 8 */ [ [-1, -1, 1, -1], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 1], [-1, 0, 1, 0] ],
  /* 9 */ [ [-1, -1, 1, -1], [-1, 0, 1, 0], [1, -1, 1, 1], [-1, 1, 1, 1], [-1, -1, -1, 0] ],
];

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.external.countdown.prototype.draw = function(delta) {
  // Updates camera settings.
  this._camera.update(delta);
  this._frame.properties.position = this._camera.position();
  this._frame.properties.orientation = this._camera.orientation();

  // Updates rendering primitives.
  this._rotate += delta / 50000;

  // Renders to offline screen.
  const screen = this._fbo.bind();
  this._screen.fillColor(0.3, 0.2, 0.4, 1);
  this._frame.draw(delta);

  // Renders to screen with effects.
  screen.bind();
  this._screen.fillColor(0, 0, 0, 1);
  // Use Math.random() because draw() calls are not reproducible.
  this._effect.properties.volume = Math.random() * 0.03;
  this._effect.draw(delta, this._fbo.texture);
};

MajVj.external.countdown.prototype._drawNumber = function(api, n) {
  api.setAlphaMode(true, api.gl.ONE, api.gl.ONE);
  api.color = [0.8, 0.5, 1.0, 1.0];
  const pattern = this._patterns[n];
  for (let data of pattern) {
    api.drawLine([data.sx, data.sy, 0], [data.ex, data.ey, 0]);
  }
};

MajVj.external.countdown.prototype._drawNumber = function(api, n1, n2, rate) {
  api.setAlphaMode(true, api.gl.ONE, api.gl.ONE);
  api.color = [0.5, 0.5, 1.0, 1.0];
  const p1 = this._patterns[n1];
  const p2 = this._patterns[n2];
  const r1 = 1 - rate;
  const r2 = rate;
  for (let i = 0; i < p1.length; ++i) {
    let nx = this._random.generate(-1, 1);
    let ny = this._random.generate(-1, 1);
    api.drawLine(
        [nx + p1[i].sx * r1 + p2[i].sx * r2, ny + p1[i].sy * r1 + p2[i].sy * r2, 0],
        [nx + p1[i].ex * r1 + p2[i].ex * r2, ny + p1[i].ey * r1 + p2[i].ey * r2, 0]);
  }
};

MajVj.external.countdown.prototype._draw = function(api) {
  api.color = [0.05, 0.05, 0.3, 1.0];
  const rotate = [ [ 0, this._rotate, 0 ] ];
  api.drawPrimitive(this._stars, 0.02, 0.02, 0.02, [0, 0, 0], rotate);
  api.drawPrimitive(this._sphere, 100, 100, 100, [0, 0, 0], rotate);
  
  var n1 = this._number;
  var n2 = (n1 != 0) ? (this._number - 1) : 0;
  var c = (this._count < 9) ? 0 : (this._count - 9);

  this._drawNumber(api, n1, n2, c);
  this._count += api.delta / 200;
  if (this._count > 10) {
    this._count -= 10;
    if (this._number != 0)
      this._number--;
  }
};