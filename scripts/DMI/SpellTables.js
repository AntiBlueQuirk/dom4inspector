//namespace scope
(function( DMI, $, undefined ){
		
var MSpell = DMI.MSpell = DMI.MSpell || {};

var Format = DMI.Format;
var Utils = DMI.Utils;
var modctx = DMI.modctx;


//////////////////////////////////////////////////////////////
// SPELL VALUE TRANSLATION
/////////////////////////////////////////////////////////////

// used for spell fields: (damage, aoe, range, nbr_of_effects)
// each 1000 adds 1 per caster path (above base casting level)
//examples:
//  10     ->   10
//  1010   ->   10+
//  3010   ->   10+++
//  10010  ->   10+ [10/lvl]
//  -25025 ->   -25- [25/lvl]
function spellBonus(v, baselvl) {
	v = parseInt(v || '0');
	baselvl = parseInt(baselvl || '0');
	
	//strip thousands
	var vbase = v % 1000;
	//count thousands
	var bonus = (v-vbase) / 1000;
	
	//baselvl is minimum caster lvl (add compulsory bonus to match ingame display) 
	vbase = vbase + (baselvl * bonus)
	
	//support negative values
	var chr = '+',  suf = '';
	if (bonus < 0) {
		bonus = -bonus;
		chr = '-';
	}
	//10+ (4/lvl)
	if (bonus > 3)
		suf = chr+' ['+bonus+'/lvl]';
	//10+++
	else if (bonus > 0)
		suf = (new Array( bonus + 1 ).join( chr ));
	
	return String(vbase) + suf;
}

//format functions for spell fields
// using spellBonus + other field specific stuff
MSpell.format = {
	
	damage: function(spell, effect) {
		return String(spellBonus(effect.raw_argument, spell.pathlevel1));
	},

	effect: function(neffect) {
		neffect = parseInt(neffect);
		if (neffect > 999 && (neffect < 10000 || neffect > 20000))
			return neffect % 1000;
		return neffect;
	}
}

function show_summon(unit, count, pathlevel1) {
	var ref;
	if (parseInt(unit) < 0) {
		ref = modctx.monster_tags_lookup[parseInt(unit)];
		if (ref) {
			ref = ref.name;
		} else {
			ref = '';
			for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {
				if (o.montag) {
					if (-parseInt(unit) == parseInt(o.montag)) {
						ref = ref + Utils.unitRef(o.id) + ', <br />';
					}
				}
			}
		}
	} else {
		ref = Utils.unitRef(unit);
	}
	if (count && count != "0" && count != "1") {
		ref = ref + " x " + String(spellBonus(count, pathlevel1))
	}
	return ref;
}

function list_summons(spell, effect) {
	var arr;
	if (effect.effect_number == "76") {
		arr = MSpell.tartarianGate;
	} else if (effect.effect_number == "89") {
		arr = MSpell.uniqueSummon[effect.raw_argument];
	} else if (effect.effect_number == "100") {
		arr = MSpell.terrainSummon[effect.raw_argument];
	} else if (effect.effect_number == "114") {
		arr = MSpell.uniqueSummon[effect.raw_argument];
	}
	
	if (!arr) {
		arr = [spell.damage];
	}
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++)
		tokens.push( show_summon(uid, 1) );
	
	//comma separated & one per line
	return tokens.join(', <br />');
}

MSpell.tartarianGate = [771, 772, 773, 774, 775, 776, 777];

MSpell.uniqueSummon = {
		1:	/* Bind Ice Devil */ [
		    306, 821,  822, 823, 824, 825],
		2:	/* Bind Arch Devil */ [
			305, 826, 827, 828, 829],
		3:	/* Bind Heliophagus */ [
		    492, 818, 819, 820],
		4:	/* King of Elemental Earth */ [
		    906, 469],
		5:	/* Father Illearth */ [
		    470],
		6:	/* Queen of Elemental Water */ [
		    359, 907, 908],
		7:	/* Queen of Elemental Air */ [
		    563, 911, 912],
		8:	/* King of Elemental Fire */ [
		    631, 910],
		9:	/* King of Banefires */ [
		    909],
		10:	/* Bind Demon Lord */ [
		    446, 810, 900, 1405, 2277, 2278],
		11:	/* Awaken Treelord */ [
		    621, 980, 981],
		12:	/* Call Amesha Spenta */ [
		    1375, 1376, 1377, 1492, 1493, 1494],
		13:	/* Summon Tlaloque */ [
		    1484, 1485, 1486, 1487],
		14:	/* Release Lord of Civilization */ [
		    2063, 2065, 2066, 2067, 2064, 2062]
}

MSpell.terrainSummon = {
		1: /* Hidden in Snow */ [
			1201, 1200, 1202, 1203],
		2: /* Hidden in Sand */ [
			1979, 1978, 1980, 1981],
		3: /* Hidden Underneath */
			[2522, 2523, 2524, 2525]
}

//used in effectlookup
var damage = 		MSpell.format.damage;
var damage_untested = 	function (v,o){ return damage(v,o) + ' ?'; }

MSpell.effectlookup = {
		'unknown': function (spell, effect){ return 'Unknown Effect ' + effect.effect_number + ' ('+effect.raw_argument + ')?'; },
		0:	'Nothing',
		1:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		2:	damage,
		3:	damage,
		4:	damage,
		7:	damage,
		8:	damage,
		10:	function(spell, effect) {
			var mask = modctx.buffs_1_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		11:	function(spell, effect) {
			var mask = modctx.special_damage_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		13:	damage,
		15:	'teleports to capital',
		19:	'teleport',
		20:	damage,
		21:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		22:	'Fate of Oedipus',
		23:	function(spell, effect) {
			var mask = modctx.buffs_2_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		24:	damage,
		25:	'Wish',
		26:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		27:	'magic duel',
		28:	'control',
		29:	'take permanent control',
		30:	damage,
		31:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		35:	function(spell, effect) {
			return spellBonus(spell.effects_count, spell.pathlevel1);
		},
		37:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		38:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		39:	damage,
		40:	damage,
		41:	damage,
		42:	function (spell, effect) {
			return modctx.anon_province_events_lookup[effect.raw_argument].name;
		},
		43:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		44:	damage,
		46:	damage,
		48:	function(spell, effect) { 
			return {
				0: Format.Gems('F')	,
				1: Format.Gems('A')	,
				2: Format.Gems('W')	,
				3: Format.Gems('E')	,
				4: Format.Gems('S')	,
				5: Format.Gems('D')	,
				6: Format.Gems('N')	,
				7: Format.Gems('B')	,
				8: Format.Gems('H')	,
				51: Format.Gems('FAWE')	,
				55: Format.Gems('FAWESDNBH')	
				}[effect.raw_argument] || { 
					'invalid damage value': 		raw_argument 
				};
		},
		49:	damage_untested,
		50:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		53:	damage_untested,
		54:	damage_untested,
		57:	damage_untested,
		62:	damage_untested,
		63:	damage_untested,
		64:	damage_untested,
		66: damage,
		67: damage,
		68:	damage_untested,
		70:	damage_untested,
		72:	damage,
		73:	damage,
		74:	damage,
		75:	damage_untested,
		76:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		77:	damage_untested,
		79:	damage_untested,
		80:	damage_untested,
		81:	function (spell, effect) {
			return modctx.enchantments_lookup[effect.raw_argument].name;
		},
		82:	function (spell, effect) {
			return modctx.enchantments_lookup[effect.raw_argument].name;
		},
		84:	function (spell, effect) {
			return modctx.enchantments_lookup[effect.raw_argument].name;
		},
		85:	damage_untested,
		86:	damage_untested,
		89:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		90:	damage_untested,
		91:	damage,
		92:	damage_untested,
		93:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		94:	damage_untested,
		95:	damage_untested,
		96:	damage,
		97:	damage,
		98:	damage_untested,
		99:	damage_untested,
		100:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		101:	damage,
		102:	damage_untested,
		103:	damage,
		104:	damage,
		105:	damage_untested,
		106:	damage_untested,
		107:	damage,
		108:	damage_untested,
		109:	damage,
		110:	damage_untested,
		111:	damage,
		112:	damage_untested,
		113:	damage_untested,
		114:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		115:	damage_untested,
		116:	damage_untested,
		117:	damage_untested,
		118:	damage_untested,
		119:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		120:	damage_untested,
		500:	damage_untested,
		504:	damage_untested,
		509:	damage_untested,
		514:	damage_untested,
		524:	damage_untested,
		599:	damage_untested,
		600:	damage_untested,
		601:	damage_untested,
		609:	damage_untested		
}



//namespace args
}( window.DMI = window.DMI || {}, jQuery ));