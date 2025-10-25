// js/misc/merchantDialogues.js
// Central place for all Merchant dialogue trees.

export const MERCHANT_DIALOGUES = {
  intro: {
    start: 'n0',
    nodes: {
      n0: { type: 'line', say: 'So you want to delve deeper within my shop, do you?', next: 'c1' },

      r_who:     { type: 'line', say: 'I am the Merchant.', next: 'c2' },
      r_where:   { type: 'line', say: 'The cove.',          next: 'c2' },
      r_confused:{ type: 'line', say: 'Ok.',                next: 'c2' },

      c1: { type: 'choice', options: [
        { label: 'Who are you?', to: 'r_who' },
        { label: 'Where am I?', to: 'r_where' },
        { label: 'I just clicked on this green button and now I’m confused.', to: 'r_confused' },
      ]},

      c2: { type: 'choice', options: [
        { label: 'What?', to: 'r2_what' }, 
        { label: 'That’s not helpful.', to: 'r2_ok' }, 
        { label: 'Ok.', to: 'r2_ok' }, 
      ]},

      r2_what: { type: 'line', say: 'What?', next: 'c3' },
      r2_ok:   { type: 'line', say: 'Ok.',   next: 'c3' },

      c3: { type: 'choice', options: [
        { label: 'What?', to: 'r2_what' },
        { label: 'That’s not helpful.', to: 'r2_ok' },
        { label: 'Goodbye.', to: 'end' },
      ]},
    }
  },
};