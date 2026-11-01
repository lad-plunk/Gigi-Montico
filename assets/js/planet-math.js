/* Great-circle movement and parallel transport on a sphere. */
(() => {
  'use strict';
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const scale = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
  const add = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
  const norm = a => {const m = Math.hypot(...a); return m ? scale(a, 1/m) : [0, 0, 0];};
  function rotate(v, axis, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return add(add(scale(v,c), scale(cross(axis,v),s)), scale(axis,dot(axis,v)*(1-c)));
  }
  function advance(up, forward, ahead, sideways, distance, radius) {
    const direction = norm(add(scale(forward,ahead), scale(norm(cross(forward,up)),sideways)));
    if (dot(direction,direction) < .5 || !distance) return {up, forward};
    const axis = norm(cross(up,direction));
    const nextUp = norm(rotate(up,axis,distance/radius));
    const candidate = rotate(forward,axis,distance/radius);
    const nextForward = norm(add(candidate,scale(nextUp,-dot(candidate,nextUp))));
    return {up:nextUp,forward:nextForward};
  }
  globalThis.MonticoPlanetMath = {dot,cross,scale,add,norm,rotate,advance};
})();
