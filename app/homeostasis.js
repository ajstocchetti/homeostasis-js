function getScreenHeight() { return window.innerHeight; }
function randomHeight() { return Math.random() * getScreenHeight(); }
function getScreenWidth() { return window.innerWidth; }
function randomWidth() { return Math.random() * getScreenWidth(); }

function toUnitVector(x = randomCentered(), y = randomCentered()) {
  const magnitude = Math.sqrt((x * x) + (y * y));
  const xBar = x / magnitude;
  const yBar = y / magnitude;
  return { x: xBar, y: yBar };
}

class Element {
  constructor(icon = 'flamingos', x = randomWidth(), y = randomHeight(), speed) {
    this.x = x;
    this.y = y;
    this.nextX = x;
    this.nextY = y;

    this.atHomeostasis = false;

    this.imgHeight = 35;
    this.imgWidth = 35;

    this.el = document.createElement('img');

    this.el.setAttribute('src', `./zoo-icons/${icon}.svg`);
    this.el.style.width = `${this.imgWidth}px`;
    this.el.style.height = `${this.imgHeight}px`;
    this.el.style.position = 'absolute';

    this.el.draggable = true;
    this.el.ondragend = evt => {
      this.dragging = false;
    }
    this.el.ondrag = evt => {
      this.dragging = true;
      this.x = evt.x;
      this.y = evt.y;
      this.nextX = evt.x;
      this.nextY = evt.y;
      this.present();
    }

    this.speed = (Math.random() / 2) + 0.5; // 0.5 -> 1
    this.direction = toUnitVector();

    document.getElementById('canvas').appendChild(this.el);
    this.present();
  }

  destruct() {
    document.getElementById('canvas').removeChild(this.el);
  }

  getNeighbors() {
    // TODO: optimize this function
    const all = window._elements;
    let position = -1;
    all.forEach((el, index) => {
      if (el == this) position = index;
    });

    const neighbors = [];
    if (position === 0) {
      // first in array
      neighbors.push(all[1]);
      neighbors.push(all[all.length - 1]);
    } else if (position === all.length - 1) {
      // last element in array
      neighbors.push(all[all.length - 2]);
      neighbors.push(all[0]);
    } else {
      // not on border of array
      neighbors.push(all[position - 1]);
      neighbors.push(all[position + 1]);
    }
    return neighbors;
  }

  setNextState() {
    if (this.dragging) return; // do not try to update while element is being moved

    const neighbors = this.getNeighbors();
    const numElements = neighbors.length;

    // First, find the middle position of the other neighbors
    const avgX = neighbors.reduce((sum, el) => sum += el.x, 0) / numElements;
    const avgY = neighbors.reduce((sum, el) => sum += el.y, 0) / numElements;

    // now find the line that goes through the middle of the neighbors
    // this line is equal distand from neighbors
    // const slopeBisector = -1 * (neighbors[0].x - neighbors[1].x) / (neighbors[0].y - neighbors[1].y);
    // slope of the neighbors will be the slope of the path that this element takes to its next point
    const slopeNeighbors = (neighbors[0].y - neighbors[1].y) / (neighbors[0].x - neighbors[1].x);
    const slopeBisector = -1 / slopeNeighbors;

    const desiredX = ((slopeBisector * avgX) - avgY - (slopeNeighbors * this.x) + this.y) / (slopeBisector - slopeNeighbors);
    const desiredY = slopeNeighbors * (desiredX - this.x) + this.y;

    const direction = toUnitVector(desiredX - this.x, desiredY - this.y);
    const nextX = this.x + this.speed * direction.x;
    const nextY = this.y + this.speed * direction.y;
    // when elements get close to final position they tend to "wiggle" back and forth
    // if they're within 1 px dont move them to address this wiggling

    this.atHomeostasis = (Math.abs(desiredX - nextX) < 1) && (Math.abs(desiredY - nextY) < 1);
    if (!this.atHomeostasis) {
      this.nextX = nextX;
      this.nextY = nextY;
    }
  }

  advance() {
    this.x = this.nextX;
    if (this._xMin() < 0) {
      this.x = this.imgWidth / 2;
    } else if (this._xMax() > getScreenWidth()) {
      this.x = getScreenWidth() - (this.imgWidth / 2);
    }

    this.y = this.nextY;
    if (this._yMin() < 0) {
      this.y = this.imgHeight / 2;
    } else if (this._yMax() > getScreenHeight()) {
      this.y = getScreenHeight() - (this.imgHeight / 2);
    }

    this.present();
  }

  _xMin() { return this.x - (this.imgWidth / 2); }
  _xMax() { return this.x + (this.imgWidth / 2); }
  _yMin() { return this.y - (this.imgHeight / 2); }
  _yMax() { return this.y + (this.imgHeight / 2); }


  present() {
    const t = this._yMin()
    const l = this._xMin();
    this.el.style.top = `${t}px`
    this.el.style.left = `${l}px`;
  }
}

function advanceElements() {
  window._elements.forEach(e => e.setNextState());
  window._elements.forEach(e => e.advance());
  const allAtHomeostasis = window._elements.reduce((acc, el) => {
    return acc && el.atHomeostasis;
  }, true);
  if (allAtHomeostasis) {
    const additions = [
      'flamingos',
      'bison',
      'kiwi',
      'parrot',
      'ostrich',
      'snake',
      'sloth',
      'raccoon',
      'giraffe',
      'dolphin',
    ];
    if (window._elAdding) {
      const maxElements = Math.min(additions.length, getScreenWidth() / 100, getScreenHeight() / 80);
      if (window._elements.length >= maxElements) {
        window._elAdding = false;
        window._elements.pop().destruct();
      } else {
        window._elements.push(new Element(additions[window._elements.length]));
      }
    } else {
      if (window._elements.length <= 3) {
        // should never get below 3
        window._elAdding = true;
        window._elements.push(new Element(additions[window._elements.length]));
      } else {
        window._elements.pop().destruct();
      }
    }
  }
}

function randomCentered(max = 1) {
  // returns a number between -max and max
  return (Math.random() * max) - (max / 2);
}

window.onload = async function() {
  document.getElementById('canvas').addEventListener("dragover", function(event) {
    // prevent default to allow drop
    event.preventDefault();
  }, false);

  window._elAdding = true;
  window._elements = [
    new Element('flamingos'),
    new Element('bison'),
    new Element('kiwi'),
  ]
  setInterval(advanceElements, 20);
  advanceElements();
}
