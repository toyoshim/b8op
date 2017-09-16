/**
 * T'MediaArt library for JavaScript
 *  - MajVj extension - external plugin - countdown -
 * @param options options (See MajVj.prototype.create)
 */
MajVj.external.countdown = function(options) {
  this._mv = options.mv;
  this._screen = options.screen;
  this._fft = new Uint8Array(1024);
  this._rolls = [];
  this._rollBases = [];
  this._time = 0;
  this._nextFocusUpdate = 32.7;
  this._focusDuration = 10.9;
  this._focus = 0;
  this._random = options.mv.create('misc', 'random');
  this.properties = {
    fft: new Uint8Array(1024),
    fftDb: new Float32Array(1024)
  };

  // Setups audio playback.
  this._sound = options._sound;
  this._playing = false;

  // Setups WebFont.
  this._font = new FontFace('external-ending-mono',
      'url(scenes/fonts/ShareTechMono.woff2)');
  this._font.load();
  document.fonts.add(this._font);
  this._styles = {
    bold: {
      name: 'external-ending-mono',
      size: 64,
      weight: 'bold',
      fg: 'rgb(255, 240, 240)',
      linespace: 0.8,
      alignment: 'left',
      direction: 1,
    },
    center: {
      name: 'external-ending-mono',
      size: 90,
      weight: 'bold',
      fg: 'rgb(255, 240, 240)',
      linespace: 0.8,
      alignment: 'center',
      direction: 1,
    },
    normal: {
      name: 'external-ending-mono',
      size: 56,
      fg: 'rgb(240, 255, 255)',
      linespace: 0.7,
      alignment: 'right',
      direction: -1,
    }
  };
  document.fonts.ready.then(() => {
    // Creates stuff roll objects.
    this._rolls.push(options.mv.create('frame', 'textroll', {
      camera: this._camera,
      position: [ 0, 0, 50 ],
      scale: 0.5,
      rotate: 0,
      speed: 0,
      styles: this._styles,
      texts: [
        { style: 'center', text: 'Google Got Talent' },
        { style: 'center', text: '2016' },
        { style: 'center', text: 'Credits' },
      ]
    }));
    this._rollBases.push({ position: [ 0, 0, 50 ], rotate: 0 });

    this._createRoll('Staff');

    this._random.generate();
    this._createRoll('Event Leads', ['Machie Hanawa', 'Momoko Fukuyo']);
    this._random.generate();
    this._createRoll('Committe', ['Nodoka Araki']);
    this._createRoll('Stage Setting', ['Yum Morimoto']);
    this._random.generate();
    this._createRoll('Screen Visual', ['Takashi Toyoshima', '@MadiaArt-JP']);
    this._createRoll('MC', [
        'Kei Okaniwa', 'Yukari Shiotsuki', 'Isamu Hirano', 'Kevin Tochigi']);
    this._random.generate();
    this._random.generate();
    this._createRoll('Volunteer', [
        'Naoki Oyama', 'Yuka Hasegawa', 'Taketo Takahashi', 'Chuyi Guo',
        'Go Anagama']);

    this._createRoll('');
    this._createRoll('Performer');

    this._random.generate();
    this._createRoll('The Lost Tribe of Atmo', [
        'Ariel Kern', 'Keisuke Akiyama', 'Honoka Mizutani', 'Yoichi Sato']);
    this._createRoll('Solo', ['Alex Berry']);
    this._createRoll('YMKA', ['Aijia Yan ', 'Madoka Katayama']);
    this._createRoll('Musicians-jp vs DTM-jp', [
        'Nathaniel Wong', 'Alex Norton', 'Ignas Kukenys', 'Haruo Takamatsu',
        'Tomasz Mikolajewski', 'Yum Morimoto']);
    this._random.generate();
    this._createRoll('Solo', ['Audrey Kwak']);
    this._createRoll('Solo', ['Leo Hourvitz']);
    this._createRoll('KAS Paradice Orchestra', [
        'Masato Kume  ', 'Shin Nishihara  ', 'Chi Tran  ']);
    this._createRoll('', [
        'Hiroyuki Hayashi', 'Kazuki Takasawa', 'Adele Pinet', 'Marina Onuki']);
        //'Hiroyuki Hayashi', 'Kazuki Takasawa', 'Adèle Pinet', 'Marina Onuki']);
    this._createRoll('Androiders', [
        'Adrian Chih', 'Iwao Akiba', 'Junya Sato']);
    this._createRoll('Dance-JP', [
        'Hyatt Matsuda', 'Akiko Noguchi', 'Allie Sakakibara', 'Ariel Kern',
        'Honoka Mizutani']);
    this._random.generate();
    this._random.generate();
    this._createRoll('', ['Karen Yoshikawa', 'Kei Okaniwa', 'Machie Hanawa',
        'Mike Katayama', 'Momoko Fukuyo', 'Nodoka Araki']);
    this._random.generate();
    this._random.generate();
    this._random.generate();
    this._random.generate();
    this._random.generate();
    this._random.generate();
    this._createRoll('Salsa-JP', [
        'Katsuaki Hayashi', 'Alfonso Vega Garcia', 'Angela Pham', 'Jiamei Du',
        'Francisco Soares', 'Sophie Lee']);

    this._createRoll('Powered by', ['Chrome']);
    /*
    this._random.generate();
    this._random.generate();
    this._random.generate();
    */
    this._createRoll('Google Tokyo');

    // Starts audio playback.
    this._sound.fetch('songs/frontier.mp3', true).then(() => {
      this._playing = true;
    });
  });

  // Setups effect module.
  this._effect = options.mv.create('effect', 'noise', {
      disable: ['color', 'slitscan', 'noise']
  });
  this._effect.properties.noise_level = [0.0, 0.1, 0.0];
  this._effect.properties.noise_color = [1, 1, 0];
  this._fbo = options.mv.screen().createFrameBuffer();

  // Setups 3D API interface.
  this._frame = options.mv.create('frame', 'api3d', {
    draw: this._draw.bind(this)
  });
  this._camera = options.mv.create('misc', 'camera');
  this._camera.moveTo(0, [0, 0, 250]);
  this._camera.lookAt(0, [0, 0, 0]);

  // Setups rendering primitives.
  this._sphere = TmaModelPrimitives.createSphere(
      5,
      TmaModelPrimitives.SPHERE_METHOD_EVEN,
      TmaModelPrimitives.SPHERE_FLAG_NO_TEXTURE
  );
  this._sphereRotate = 0;
  this._sphereVertices = this._sphere.getVertices().slice(0);

  this._stars = TmaModelPrimitives.createStars(10000, 30000);
};

/**
 * Draws a frame.
 * @param delta delta time from the last rendering
 */
MajVj.external.countdown.prototype.draw = function(delta) {
  // Updates camera settings.
  this._camera.update(delta);
  this._updateFocus(delta);
  this._frame.properties.position = this._camera.position();
  this._frame.properties.orientation = this._camera.orientation();

  // Updates rendering primitives.
  this._sphereRotate += delta / 10000;
  this._analyzeSound();

  // Renders to offline screen.
  var screen = this._fbo.bind();
  this._screen.fillColor(0, 0, 0, 1);
  this._frame.draw(delta);
  this._rolls.forEach(roll => roll.draw(delta));

  // Renders to screen with effects.
  screen.bind();
  this._screen.fillColor(0, 0, 0, 1);
  // Use Math.random() because draw() calls are not reproducible.
  this._effect.properties.volume = Math.random() * 0.03;
  this._effect.draw(delta, this._fbo.texture);
};

MajVj.external.countdown.prototype._draw = function(api) {
  api.color = [0.1, 0.1, 1.0, 1.0];
  api.drawPrimitive(this._stars, 0.02, 0.02, 0.02, [0, 0, 0]);
  var sphereRotate = [ [ 0, this._sphereRotate, 0 ] ];
  api.drawPrimitive(this._sphere, 100, 100, 100, [0, 0, 0], sphereRotate);
};

MajVj.external.countdown.prototype._analyzeSound = function() {
  if (!this._playing)
    return;
  var vertices = this._sphere.getVerticesBuffer(this._screen);
  var buffer = vertices.buffer();
  var n = buffer.length - 1;
  var l = this._fft.length;
  var m = (l - 1) * 2;
  var fft = this.properties.fft;
  var originalVertices = this._sphereVertices;
  for (var i = 0; i < buffer.length; ++i) {
    var offset = (i / n * m) | 0;
    if (offset >= l)
      offset = offset - l;
    buffer[i] = originalVertices[i] * (1 + fft[offset] / 512);
  }
  vertices.update();
};

MajVj.external.countdown.prototype._createRoll = function (caption, texts) {
  var t1 = this._random.generate(0, 2 * Math.PI);
  var t2 = this._random.generate(0, 2 * Math.PI);
  var size = 400;
  var p = [size * Math.sin(t1) * Math.cos(t2),
           size * Math.sin(t1) * Math.sin(t2),
           size * Math.cos(t1)];
  var data = {
    camera: this._camera,
    position: p,
    scale: 0.005,
    rotate: this._random.generate(0, 2 * Math.PI),
    speed: 0,
    styles: this._styles,
    texts: []
  };
  if (!texts) {
    data.texts.push({ style: 'center', text: caption });
  } else {
    data.texts.push({ style: 'bold', text: caption });
    texts.forEach(text => data.texts.push({ style: 'normal', text: text}));
  }
  this._rolls.push(this._mv.create('frame', 'textroll', data));
  this._rollBases.push({ position: p, rotate: data.rotate });
}

MajVj.external.countdown.prototype._updateFocus = function (delta) {
  if (!this._playing)
    return;
  this._time += delta / 1000;

  if (this._time > this._nextFocusUpdate) {
    this._nextFocusUpdate += this._focusDuration;
    this._focus++;
    // Oops, the tune has a break here!
    if (this._focus == 16)
      this._nextFocusUpdate += this._focusDuration / 4;
    if (this._focus == this._rolls.length) {
      this._focus--;
      return;
    }
    this._rolls[this._focus].properties.speed = 0.00003;
    var base = this._rollBases[this._focus];
    var p = base.position;
    var r = base.rotate;
    var sin = Math.sin(r) * 2;
    var cos = Math.cos(r) * 2;
    var position = [ p[0] + sin, p[1], p[2] + cos ];
    this._camera.moveTo(300, position);
    this._camera.lookTo(500, [ -sin, 0, -cos ]);
  }
}
