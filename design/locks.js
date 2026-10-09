/** Canal locks: stepped basins, paired hinged gates, and raised retaining walls.
 * The pointer selects a chamber; its gates open, with neighbouring gates following
 * at decreasing reach. Picking uses each chamber's fixed resting water plane.
 */
const { Cam, facing, fit, proj, unproj, rings, prism, solid, put, mk,
  pointer, register, disposer, tween, tset, tval, tdone, rad } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-4, -4, 0], [62, 140, 0], [62, -4, 48], [-4, 140, 32]], 200, 166);
  const P = proj(C), front = facing(C);
  const group = mk('g', {}, svg);
  const chambers = [];
  function block(parent, x0, y0, x1, y1, z0, z1) {
    const [ring, inner] = rings(x0, y0, x1, y1, 2.8, 0.7);
    const element = solid(parent);
    put(element, prism(P, front, ring, inner, z0, z1));
    return element;
  }
  for (let i = 0; i < 3; i++) {
    const y = i * 44, z = 20 - i * 8;
    const g = mk('g', {}, group);
    block(g, -2, y, 58, y + 42, z, z + 3);
    block(g, -2, y, 5, y + 42, z + 3, z + 23);
    block(g, 5, y + 1, 51, y + 41, z + 3, z + 4.5);
    const gates = [solid(g), solid(g)];
    // Near retaining wall is painted after the gates to hide the hinge feet.
    block(g, 51, y, 58, y + 42, z + 3, z + 23);
    chambers.push({ y, z, gates, angle: tween(i === 1 ? 12 : i === 0 ? 6 : 3), last: null });
  }
  function draw(chamber, angle) {
    if (chamber.last === angle) return;
    chamber.last = angle;
    chamber.gates.forEach((gate, side) => {
      const a = rad(angle), sign = side === 0 ? 1 : -1;
      const hinge = side === 0 ? 5 : 51;
      const Q = (x, y, z) => P(hinge + sign * (x * Math.cos(a) - y * Math.sin(a)),
        chamber.y + 35 - x * Math.sin(a) - y * Math.cos(a), z);
      const [ring, inner] = rings(0, -1.7, 23, 1.7, 1.3, 0.45);
      put(gate, prism(Q, front, ring, inner, chamber.z + 4.5, chamber.z + 20));
    });
  }
  chambers.forEach((chamber, i) => { draw(chamber, i === 1 ? 12 : i === 0 ? 6 : 3); chamber.gates.forEach((gate) => gate.sil.classList.toggle('hi', i === 1)); });
  const loop = register(stage, (_dt, time) => {
    let moving = false;
    chambers.forEach((chamber) => { draw(chamber, tval(chamber.angle, time)); if (!tdone(chamber.angle, time)) moving = true; });
    return moving;
  });
  bag.add(loop.unregister);
  let active = -1;
  function choose(next) {
    if (next === active) return;
    const origin = next < 0 ? active : next;
    active = next;
    const time = performance.now();
    chambers.forEach((chamber, i) => {
      const distance = Math.abs(i - origin);
      const rest = i === 1 ? 12 : i === 0 ? 6 : 3;
      tset(chamber.angle, next < 0 ? rest : reach / (1 + distance * 2), time, distance * 45);
      chamber.gates.forEach((gate) => gate.sil.classList.toggle('hi', i === (next < 0 ? 1 : next)));
    });
    read.textContent = next < 0 ? 'rest' : `lock ${next + 1}`;
    loop.wake();
  }
  function hit(point) {
    let chosen = -1, nearest = Infinity;
    chambers.forEach((chamber, i) => {
      const [x, y] = unproj(C, point[0], point[1], chamber.z + 4.5);
      if (x < 0 || x > 58 || y < chamber.y || y > chamber.y + 42) return;
      const centre = P(28, chamber.y + 23, chamber.z + 4.5);
      const distance = Math.hypot(point[0] - centre[0], point[1] - centre[1]);
      if (distance < nearest) { chosen = i; nearest = distance; }
    });
    return chosen;
  }
  bag.add(pointer(stage, { move: (point) => choose(hit(point)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { reach = next; if (active >= 0) { const selected = active; active = -1; choose(selected); } }, destroy: bag.dispose };
}
hairline({ name: 'locks', means: 'Three canal locks: gates open around your pointer, making space to pause before passage.',
  rules: [1, 2, 4, 6, 8, 9], range: [20, 42, 64], tour: [[243, 130], [201, 169], [147, 207], null], mount });
