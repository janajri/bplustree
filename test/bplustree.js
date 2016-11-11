/* eslint-env node, mocha */
const BPlusTree = require('../lib/bplustree');
const assert = require('assert');

const setup = (n) => {
  const tree = new BPlusTree({ order: 4, debug: true });
  const data = [[1, 'z'], [2, 'b'], [3, 'c'], [3, 'c2'], [4, 'd'], [5, 'e'], [6, 'f'], [7, 'g'], [8, 'h'], [10, 'm'], [11, 'n'], [12, 'p']];
  for (let i = 0; i < ((n || n > data.length ? data.length : n) || data.length); i++) {
    tree.store(data[i][0], data[i][1]);
  }
  return tree;
};

describe('BPlusTree', () => {
  it('should be created', () => {
    let tree = new BPlusTree();
    assert.equal(tree.debug, false);
    tree = new BPlusTree({ debug: true });
    assert.equal(tree.order, 6);
    assert.equal(tree.tree.k.length, 0);
    assert.equal(tree.tree.v.length, 0);
    assert.throws(() => new BPlusTree({ order: 7, debug: true }));
  });

  it('should insert and rebalance', () => {
    const tree = new BPlusTree({ order: 4, debug: true });
    let e = {};
    e = { t: 'leaf', k: [1], v: [['a']], n: null };
    tree.store(1, 'a');
    assert.deepEqual(tree.tree, e);
    e = { t: 'leaf', k: [1, 2], v: [['a'], ['b']], n: null };
    tree.store(2, 'b');
    assert.deepEqual(tree.tree, e);
    e = { t: 'leaf', k: [1, 2, 3], v: [['a'], ['b'], ['c']], n: null };
    tree.store(3, 'c');
    assert.deepEqual(tree.tree, e);
    e = { t: 'branch',
          k: [3],
          v:
           [{ t: 'leaf', k: [1, 2], v: [['a'], ['b']], n: 3 },
             { t: 'leaf', k: [3, 4], v: [['c'], ['d']], n: null }],
          n: null };
    tree.store(4, 'd');
    assert.deepEqual(tree.tree, e);
  });

  it('should update values', () => {
    const tree = setup();
    tree.store(4, 'zz');
    assert.deepEqual(tree.fetch(4), ['d', 'zz']);
  });

  it('should get depth of trees and nodes', () => {
    const tree = setup();
    assert.equal(tree.depth(), 2);
    const node = tree.fetch(4, { getLeaf: true });
    assert.equal(tree.depth({ root: node }), 0);
  });

  it('should fetch', () => {
    const tree = setup();
    assert.deepEqual(tree.fetch(1), ['z']);
    assert.deepEqual(tree.fetch(3), ['c', 'c2']);
    assert.deepEqual(tree.fetch(4), ['d']);
    assert.deepEqual(tree.fetch(5), ['e']);
    assert.deepEqual(tree.fetch(6), ['f']);
    assert.deepEqual(tree.fetch(7), ['g']);
    assert.equal(tree.fetch(300), false);
    assert.deepEqual(tree.fetch(8), ['h']);
    assert.deepEqual(tree.fetch(10), ['m']);
    assert.deepEqual(tree.fetch(11), ['n']);
    assert.deepEqual(tree.fetch(12), ['p']);
    assert.deepEqual(tree.fetch(12, { getLeaf: true }), { t: 'leaf', k: [10, 11, 12], v: [['m'], ['n'], ['p']], n: null });
    assert.deepEqual(tree.fetch(12, { getLeaf: true, root: tree.fetch(11, { getLeaf: true }) }), { t: 'leaf', k: [10, 11, 12], v: [['m'], ['n'], ['p']], n: null });
  });

  it('should range', () => {
    let tree = new BPlusTree({ order: 4, debug: true });
    tree.store(4, 'a');
    tree.store(4, 'a');
    tree.store(4, 'b');
    assert.deepEqual(tree.fetchRange(4, 4), ['a', 'a', 'b']);

    tree = setup();
    assert.deepEqual(tree.fetchRange(2, 2), ['b']);
    assert.deepEqual(tree.fetchRange(4, 4), ['d']);
    assert.deepEqual(tree.fetchRange(4, -4), []);
    assert.deepEqual(tree.fetchRange(50, 50), []);
    assert.deepEqual(tree.fetchRange(50, -50), []);
    assert.deepEqual(tree.fetchRange(1, 2), ['z', 'b']);
    assert.deepEqual(tree.fetchRange(2, 3), ['b', 'c', 'c2']);
    assert.deepEqual(tree.fetchRange(1, 3), ['z', 'b', 'c', 'c2']);
    assert.deepEqual(tree.fetchRange(2, 4), ['b', 'c', 'c2', 'd']);
    assert.deepEqual(tree.fetchRange(1, 4), ['z', 'b', 'c', 'c2', 'd']);
    assert.deepEqual(tree.fetchRange(1, 5), ['z', 'b', 'c', 'c2', 'd', 'e']);
    assert.deepEqual(tree.fetchRange(2, 5), ['b', 'c', 'c2', 'd', 'e']);
    assert.deepEqual(tree.fetchRange(1, 4, { descending: true }), ['z', 'b', 'c', 'c2', 'd'].reverse());

    tree = new BPlusTree({ order: 50, debug: true });
    tree.store(1, 1);
    tree.store(1, 2);
    tree.store(5, 2);
    tree.store(10, 3);
    assert.deepEqual(tree.fetchRange(1, 1), [1, 2]);
    assert.deepEqual(tree.fetchRange(5, 5), [2]);
    assert.deepEqual(tree.fetchRange(10, 10), [3]);
    assert.deepEqual(tree.fetchRange(1, 5), [1, 2, 2]);
    assert.deepEqual(tree.fetchRange(1, 10), [1, 2, 2, 3]);
    assert.deepEqual(tree.fetchRange(1, 11), [1, 2, 2, 3]);
    assert.deepEqual(tree.fetchRange(-1, 11), [1, 2, 2, 3]);
    assert.deepEqual(tree.fetchRange(5, 10), [2, 3]);
    assert.deepEqual(tree.fetchRange(1, 2), [1, 2]);
    assert.deepEqual(tree.fetchRange(1, 20), [1, 2, 2, 3]);
    assert.deepEqual(tree.fetchRange(-20, 20), [1, 2, 2, 3]);
    assert.deepEqual(tree.fetchRange(4, 20), [2, 3]);
  });


	it('should range with limit', () => {
		let tree = new BPlusTree({ order: 4, debug: true });
		tree.store(4, 'a');
		tree.store(4, 'a');
		tree.store(4, 'b');
		assert.deepEqual(tree.fetchRange(4, 4), ['a', 'a', 'b']);
		assert.deepEqual(tree.fetchRange(4, null, { limit: 1 }), ['a']);

		tree = setup();
		assert.deepEqual(tree.fetchRange(2, 2), ['b']);
		assert.deepEqual(tree.fetchRange(4, 4), ['d']);
		assert.deepEqual(tree.fetchRange(4, -4), []);
		assert.deepEqual(tree.fetchRange(50, 50), []);
		assert.deepEqual(tree.fetchRange(50, -50), []);
		assert.deepEqual(tree.fetchRange(1, 2), ['z', 'b']);
		assert.deepEqual(tree.fetchRange(2, 3), ['b', 'c', 'c2']);
		assert.deepEqual(tree.fetchRange(1, 3), ['z', 'b', 'c', 'c2']);
		assert.deepEqual(tree.fetchRange(2, 4), ['b', 'c', 'c2', 'd']);
		assert.deepEqual(tree.fetchRange(1, 4), ['z', 'b', 'c', 'c2', 'd']);
		assert.deepEqual(tree.fetchRange(1, 5), ['z', 'b', 'c', 'c2', 'd', 'e']);
		assert.deepEqual(tree.fetchRange(2, 5), ['b', 'c', 'c2', 'd', 'e']);
		assert.deepEqual(tree.fetchRange(1, 4, { descending: true }), ['z', 'b', 'c', 'c2', 'd'].reverse());

		tree = new BPlusTree({ order: 50, debug: true });
		tree.store(1, 1);
		tree.store(1, 2);
		tree.store(5, 2);
		tree.store(10, 3);
		assert.deepEqual(tree.fetchRange(1, 1), [1, 2]);
		assert.deepEqual(tree.fetchRange(5, 5), [2]);
		assert.deepEqual(tree.fetchRange(10, 10), [3]);
		assert.deepEqual(tree.fetchRange(1, 5), [1, 2, 2]);
		assert.deepEqual(tree.fetchRange(1, 10), [1, 2, 2, 3]);
		assert.deepEqual(tree.fetchRange(1, 11), [1, 2, 2, 3]);
		assert.deepEqual(tree.fetchRange(-1, 11), [1, 2, 2, 3]);
		assert.deepEqual(tree.fetchRange(5, 10), [2, 3]);
		assert.deepEqual(tree.fetchRange(1, 2), [1, 2]);
		assert.deepEqual(tree.fetchRange(1, 20), [1, 2, 2, 3]);
		assert.deepEqual(tree.fetchRange(-20, 20), [1, 2, 2, 3]);
		assert.deepEqual(tree.fetchRange(4, 20), [2, 3]);
	});

  it('should check', () => {
    const tree = setup();
    assert(tree.check());
    tree.tree.v[0].t = 'brunch';
    assert.throws(() => tree.check());
    tree.tree.v[0].t = 'branch';
    const node = tree.fetch('z', { getLeaf: true });
    node.t = 'bad';
    assert.throws(() => tree.check({ root: node }));
  });

  it('should repr', () => {
    const tree = setup();
    assert.deepEqual(tree.repr(), { '1': ['z'], '2': ['b'], '3': ['c', 'c2'], '4': ['d'], '5': ['e'], '6': ['f'], '7': ['g'], '8': ['h'], '10': ['m'], '11': ['n'], '12': ['p'] });
    assert.deepEqual(tree.repr({ getKeys: true }), ['1', '2', '3', '4', '5', '6', '7', '8', '10', '11', '12']);
    assert.deepEqual(tree.repr({ getValues: true }), ['z', 'b', 'c', 'c2', 'd', 'e', 'f', 'g', 'h', 'm', 'n', 'p']);
    assert.deepEqual(tree.repr({ getValues: true, descending: true }), ['z', 'b', 'c', 'c2', 'd', 'e', 'f', 'g', 'h', 'm', 'n', 'p'].reverse());
  });

  it('should remove val', function testWithTimeout() {
    this.timeout(60000);
    let tree = setup();
    assert.equal(tree.remove(100), false);
    assert.equal(tree.remove(1, 'd'), false);
    assert.equal(tree.remove(3, 'd'), false);
    assert.equal(tree.remove(3), false);
    tree = setup(3);
    assert.equal(tree.remove(2), 'b');
    tree = setup(4);
    assert.equal(tree.remove(4), 'd');
    assert.equal(tree.remove(3, 'c'), 'c');
    tree.store(3, 'c');
    assert.equal(tree.remove(3, 'c2'), 'c2');
    tree = setup();

    let vals = [7, 11, 4, 1, 10, 8, 6, 2, 5, 12];
    for (let i = 0; i < vals.length; i++) {
      tree.remove(vals[i]);
    }
    tree.remove(3, 'c2');
    tree.remove(3, 'c');
    assert.deepEqual(tree.tree, { t: 'leaf', k: [], v: [], n: null });

    tree = new BPlusTree({ order: 4, debug: true });
    vals = [[3, 'iay'], [93, 'pvm'], [43, 'nki'], [26, 'vqc'], [29, 'gxq'], [86, 'ntf'], [172, 'guy'], [4, 'hxr'], [168, 'ojh'], [226, 'slb'], [46, 'god'], [283, 'vvj'], [126, 'qux'], [221, 'ctu'], [74, 'kvm'], [161, 'qwa'], [34, 'omk'], [115, 'eam'], [276, 'fqv'], [178, 'wcd'], [284, 'wpo'], [264, 'eya'], [200, 'jrk'], [110, 'xhs'], [100, 'spg'], [21, 'ycz'], [184, 'uix'], [220, 'wvp'], [37, 'arl'], [27, 'tdx'], [77, 'xkh'], [114, 'rrj'], [210, 'sud'], [82, 'uyg'], [256, 'jsd'], [248, 'hxa'], [6, 'vhh'], [184, 'oiv'], [247, 'duh'], [86, 'bci'], [26, 'czh'], [151, 'qlo'], [151, 'qte'], [238, 'par'], [275, 'tap'], [45, 'ksn'], [32, 'ukw'], [208, 'wgv'], [4, 'rua'], [267, 'cly'], [207, 'kcx'], [134, 'jcq'], [238, 'jtr'], [171, 'nvp'], [140, 'kdp'], [87, 'tni'], [21, 'sof'], [156, 'vae'], [167, 'nfo'], [253, 'apl'], [123, 'vgs'], [146, 'upk'], [288, 'yxn'], [76, 'ysy'], [141, 'fzd'], [230, 'doi'], [133, 'rna'], [108, 'pxq'], [231, 'gux'], [27, 'rdu'], [283, 'jyz'], [153, 'wdc'], [224, 'ucn'], [209, 'nuv'], [101, 'dpc'], [262, 'hyk'], [193, 'mlw'], [192, 'ynh'], [108, 'xkm'], [252, 'ivm'], [68, 'gka'], [72, 'hyb'], [106, 'pwz'], [289, 'dxi'], [107, 'tyl'], [48, 'kvr'], [200, 'uew'], [82, 'afj'], [281, 'ccd'], [78, 'inh'], [176, 'irb'], [48, 'ncp'], [16, 'cmc'], [238, 'jxz'], [239, 'icn'], [26, 'dpx'], [146, 'mac'], [196, 'ola'], [269, 'uls'], [93, 'zxs'], [219, 'mng'], [245, 'nok'], [153, 'nty'], [167, 'ukx'], [239, 'uxw'], [272, 'aen'], [91, 'col'], [236, 'xwr'], [55, 'gtm'], [213, 'fhd'], [99, 'ryk'], [122, 'xza'], [79, 'clo'], [241, 'lci'], [225, 'rfc'], [245, 'gvw'], [154, 'ixu'], [9, 'emv'], [98, 'ltk'], [179, 'aex'], [191, 'cdf'], [71, 'pvt'], [136, 'izb'], [260, 'bfr'], [30, 'tmd'], [99, 'ora'], [128, 'ugh'], [245, 'qjx'], [125, 'byc'], [152, 'bgy'], [165, 'osp'], [64, 'mue'], [2, 'fzh'], [79, 'qkk'], [223, 'nen'], [150, 'djt'], [32, 'dfb'], [261, 'fqz'], [133, 'ufc'], [33, 'yzl'], [63, 'ilp'], [193, 'iln'], [178, 'vfi'], [111, 'xxc'], [112, 'tfu'], [155, 'uzy'], [43, 'qad'], [251, 'myp'], [200, 'ljl'], [229, 'egb'], [45, 'itf'], [107, 'hmh'], [212, 'udv'], [149, 'nir'], [234, 'ckg'], [210, 'cmg'], [12, 'ysl'], [48, 'hgz'], [269, 'iws'], [168, 'pji'], [236, 'ujs'], [199, 'mqi'], [125, 'nta'], [121, 'xjj'], [61, 'guw'], [108, 'rmb'], [81, 'goh'], [118, 'skg'], [93, 'hcm'], [216, 'uxq'], [79, 'hds'], [281, 'ynj'], [107, 'qul'], [237, 'kis'], [42, 'nie'], [14, 'igo'], [188, 'oyb'], [133, 'cit'], [166, 'ijq'], [265, 'qpm'], [131, 'fao'], [170, 'myo'], [94, 'yzp'], [176, 'aqt'], [141, 'ybd'], [57, 'jpa'], [208, 'vmc'], [71, 'hna'], [100, 'cqe'], [189, 'qwg'], [218, 'epa'], [115, 'jxr'], [46, 'std'], [158, 'tvg'], [232, 'hbj'], [134, 'ayy'], [1, 'fqv'], [251, 'qem'], [185, 'qji'], [214, 'byt'], [144, 'ygv'], [260, 'rzy'], [142, 'azv'], [157, 'zkl'], [49, 'pif'], [205, 'lhg'], [181, 'puv'], [127, 'bmc'], [239, 'zzy'], [270, 'abj'], [266, 'dbz'], [290, 'wpd'], [84, 'rnq'], [76, 'fsv'], [144, 'qil'], [34, 'erw'], [109, 'gyx'], [126, 'lgd'], [271, 'sjy'], [276, 'dlx'], [12, 'rin'], [51, 'uml'], [189, 'zcb'], [172, 'fyp'], [286, 'dnz'], [33, 'aip'], [13, 'fmz'], [32, 'yuk'], [67, 'ifv'], [277, 'krn'], [179, 'irb'], [275, 'uqh'], [159, 'swv'], [203, 'wvx'], [146, 'okt'], [166, 'icm'], [148, 'jcm'], [196, 'kll'], [99, 'cgc'], [223, 'lvw'], [159, 'red'], [29, 'due'], [124, 'mat'], [32, 'ywm'], [123, 'kvc'], [164, 'cmo'], [26, 'gsk'], [83, 'zqm'], [210, 'cza'], [248, 'pgv'], [120, 'sha'], [19, 'jix'], [126, 'pql'], [177, 'rvn'], [280, 'jui'], [208, 'hxk'], [83, 'eui'], [236, 'gld'], [232, 'hpg'], [162, 'srr'], [232, 'zgu'], [35, 'uqe'], [121, 'gwv'], [173, 'rsu'], [67, 'brw'], [38, 'dti'], [282, 'bde'], [262, 'cmw'], [235, 'hyj'], [240, 'rhk'], [232, 'zdd'], [111, 'nja'], [24, 'pvr'], [230, 'gzx'], [232, 'zyn'], [248, 'wwz'], [17, 'apz'], [84, 'dtz'], [81, 'pkp'], [179, 'puy'], [93, 'ywo'], [40, 'bzg'], [109, 'jzn'], [67, 'boy'], [224, 'ccb'], [285, 'bqu'], [8, 'udi'], [200, 'aog'], [214, 'zms'], [171, 'hkj']];
    const remove = [[171, 'hkj'], [171, 'nvp'], [214, 'zms'], [214, 'byt'], [200, 'aog'], [200, 'ljl'], [200, 'uew'], [200, 'jrk'], [8], [285], [224, 'ccb'], [224, 'ucn'], [67, 'boy'], [67, 'brw'], [67, 'ifv'], [109, 'jzn'], [109, 'gyx'], [40], [93, 'ywo'], [93, 'hcm'], [93, 'zxs'], [93, 'pvm'], [179, 'puy'], [179, 'irb'], [179, 'aex'], [81, 'pkp'], [81, 'goh'], [84, 'dtz'], [84, 'rnq'], [17], [248, 'wwz'], [248, 'pgv'], [248, 'hxa'], [232, 'zyn'], [232, 'zdd'], [232, 'zgu'], [232, 'hpg'], [232, 'hbj'], [230, 'gzx'], [230, 'doi'], [24], [111, 'nja'], [111, 'xxc'], [240], [235], [262, 'cmw'], [262, 'hyk'], [282], [38], [173], [121, 'gwv'], [121, 'xjj'], [35], [162], [236, 'gld'], [236, 'ujs'], [236, 'xwr'], [83, 'eui'], [83, 'zqm'], [208, 'hxk'], [208, 'vmc'], [208, 'wgv'], [280], [177], [126, 'pql'], [126, 'lgd'], [126, 'qux'], [19], [120], [210, 'cza'], [210, 'cmg'], [210, 'sud'], [26, 'gsk'], [26, 'dpx'], [26, 'czh'], [26, 'vqc'], [164], [123, 'kvc'], [123, 'vgs'], [32, 'ywm'], [32, 'yuk'], [32, 'dfb'], [32, 'ukw'], [124], [29, 'due'], [29, 'gxq'], [159, 'red'], [159, 'swv'], [223, 'lvw'], [223, 'nen'], [99, 'cgc'], [99, 'ora'], [99, 'ryk'], [196, 'kll'], [196, 'ola'], [148], [166, 'icm'], [166, 'ijq'], [146, 'okt'], [146, 'mac'], [146, 'upk'], [203], [275, 'uqh'], [275, 'tap'], [277], [13], [33, 'aip'], [33, 'yzl'], [286], [172, 'fyp'], [172, 'guy'], [189, 'zcb'], [189, 'qwg'], [51], [12, 'rin'], [12, 'ysl'], [276, 'dlx'], [276, 'fqv'], [271], [34, 'erw'], [34, 'omk'], [144, 'qil'], [144, 'ygv'], [76, 'fsv'], [76, 'ysy'], [290], [266], [270], [239, 'zzy'], [239, 'uxw'], [239, 'icn'], [127], [181], [205], [49], [157], [142], [260, 'rzy'], [260, 'bfr'], [185], [251, 'qem'], [251, 'myp'], [1], [134, 'ayy'], [134, 'jcq'], [158], [46, 'std'], [46, 'god'], [115, 'jxr'], [115, 'eam'], [218], [100, 'cqe'], [100, 'spg'], [71, 'hna'], [71, 'pvt'], [57], [141, 'ybd'], [141, 'fzd'], [176, 'aqt'], [176, 'irb'], [94], [170], [131], [265], [133, 'cit'], [133, 'ufc'], [133, 'rna'], [188], [14], [42], [237], [107, 'qul'], [107, 'hmh'], [107, 'tyl'], [281, 'ynj'], [281, 'ccd'], [79, 'hds'], [79, 'qkk'], [79, 'clo'], [216], [118], [108, 'rmb'], [108, 'xkm'], [108, 'pxq'], [61], [125, 'nta'], [125, 'byc'], [199], [168, 'pji'], [168, 'ojh'], [269, 'iws'], [269, 'uls'], [48, 'hgz'], [48, 'ncp'], [48, 'kvr'], [234]];
    for (let i = 0; i < vals.length; i++) {
      tree.store(vals[i][0], vals[i][1]);
    }
    for (let i = 0; i < remove.length; i++) {
      if (remove[i][1]) {
        tree.remove(remove[i][0], remove[i][1]);
      } else {
        tree.remove(remove[i][0]);
      }
    }
  });
});
