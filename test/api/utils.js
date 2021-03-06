const expect = require('expect.js')
const fixtures = require('../fixtures')
const cheerio = require('../..')

describe('cheerio', () => {
  describe('.html', () => {
    it('() : should return innerHTML; $.html(obj) should return outerHTML', () => {
      const $div = cheerio('div', '<div><span>foo</span><span>bar</span></div>')
      const span = $div.children()[1]
      expect(cheerio(span).html()).to.equal('bar')
      expect(cheerio.html(span)).to.equal('<span>bar</span>')
    })

    it('(<obj>) : should accept an object, an array, or a cheerio object', () => {
      const $span = cheerio('<span>foo</span>')
      expect(cheerio.html($span[0])).to.equal('<span>foo</span>')
      expect(cheerio.html($span)).to.equal('<span>foo</span>')
    })

    it('(<value>) : should be able to set to an empty string', () => {
      const $elem = cheerio('<span>foo</span>').html('')
      expect(cheerio.html($elem)).to.equal('<span></span>')
    })

    it('() : of empty cheerio object should return null', () => {
      expect(cheerio().html()).to.be(null)
    })

    it('(selector) : should return the outerHTML of the selected element', () => {
      const $ = cheerio.load(fixtures.fruits)
      expect($.html('.pear')).to.equal('<li class="pear">Pear</li>')
    })
  })

  describe('.text', () => {
    it('(cheerio object) : should return the text contents of the specified elements', () => {
      const $ = cheerio.load('<a>This is <em>content</em>.</a>')
      expect($.text($('a'))).to.equal('This is content.')
    })

    it('(cheerio object) : should omit comment nodes', () => {
      const $ = cheerio.load('<a>This is <!-- a comment --> not a comment.</a>')
      expect($.text($('a'))).to.equal('This is  not a comment.')
    })

    it('(cheerio object) : should include text contents of children recursively', () => {
      const $ = cheerio.load('<a>This is <div>a child with <span>another child and <!-- a comment --> not a comment</span> followed by <em>one last child</em> and some final</div> text.</a>')
      expect($.text($('a'))).to.equal('This is a child with another child and  not a comment followed by one last child and some final text.')
    })

    it('() : should return the rendered text content of the root', () => {
      const $ = cheerio.load('<a>This is <div>a child with <span>another child and <!-- a comment --> not a comment</span> followed by <em>one last child</em> and some final</div> text.</a>')
      expect($.text()).to.equal('This is a child with another child and  not a comment followed by one last child and some final text.')
    })

    it('(cheerio object) : should omit script tags', () => {
      const $ = cheerio.load('<script>console.log("test")</script>')
      expect($.text()).to.equal('')
    })

    it('(cheerio object) : should omit style tags', () => {
      const $ = cheerio.load('<style type="text/css">.cf-hidden { display: none; } .cf-invisible { visibility: hidden; }</style>')
      expect($.text()).to.equal('')
    })

    it('(cheerio object) : should include text contents of children omiting style and script tags', () => {
      const $ = cheerio.load('<body>Welcome <div>Hello, testing text function,<script>console.log("hello")</script></div><style type="text/css">.cf-hidden { display: none; }</style>End of messege</body>')
      expect($.text()).to.equal('Welcome Hello, testing text function,End of messege')
    })
  })

  describe('.load', () => {
    it('(html) : should retain original root after creating a new node', () => {
      const $html = cheerio.load('<body><ul id="fruits"></ul></body>')
      expect($html('body')).to.have.length(1)
      $html('<script>')
      expect($html('body')).to.have.length(1)
    })

    it('(html) : should handle lowercase tag options', () => {
      const $html = cheerio.load('<BODY><ul id="fruits"></ul></BODY>', { lowerCaseTags: true })
      expect($html.html()).to.be('<body><ul id="fruits"></ul></body>')
    })

    it('(html) : should handle the `normalizeWhitepace` option', () => {
      const $html = cheerio.load('<body><b>foo</b>  <b>bar</b></body>', { normalizeWhitespace: true })
      expect($html.html()).to.be('<body><b>foo</b> <b>bar</b></body>')
    })

    // TODO:
    // it('(html) : should handle xml tag option', function() {
    //   var $html = $.load('<body><script>oh hai</script></body>', {
    //     xmlMode : true
    //   });
    //   console.log($html('script')[0].type);
    //   expect($html('script')[0].type).to.be('tag');
    // });

    it('(buffer) : should accept a buffer', () => {
      const $html = cheerio.load(Buffer.from('<div>foo</div>'))
      expect($html.html()).to.be('<div>foo</div>')
    })
  })

  describe('.clone', () => {
    it('() : should return a copy', () => {
      const $src = cheerio('<div><span>foo</span><span>bar</span><span>baz</span></div>').children()
      const $elem = $src.clone()
      expect($elem.length).to.equal(3)
      expect($elem.parent()).to.have.length(0)
      expect($elem.text()).to.equal($src.text())
      $src.text('rofl')
      expect($elem.text()).to.not.equal($src.text())
    })

    it('() : should preserve parsing options', () => {
      const $ = cheerio.load('<div>π</div>', { decodeEntities: false })
      const $div = $('div')

      expect($div.text()).to.equal($div.clone().text())
    })
  })

  describe('.parseHTML', () => {
    it('() : returns null', () => {
      expect(cheerio.parseHTML()).to.equal(null)
    })

    it('(null) : returns null', () => {
      expect(cheerio.parseHTML(null)).to.equal(null)
    })

    it('("") : returns null', () => {
      expect(cheerio.parseHTML('')).to.equal(null)
    })

    it('(largeHtmlString) : parses large HTML strings', () => {
      const html = new Array(10).join('<div></div>')
      const nodes = cheerio.parseHTML(html)

      expect(nodes.length).to.be.greaterThan(4)
      expect(nodes).to.be.an('array')
    })

    it('("<script>") : ignores scripts by default', () => {
      const html = '<script>undefined()</script>'
      expect(cheerio.parseHTML(html)).to.have.length(0)
    })

    it('("<script>", true) : preserves scripts when requested', () => {
      const html = '<script>undefined()</script>'
      expect(cheerio.parseHTML(html, true)[0].tagName).to.match(/script/i)
    })

    it('("scriptAndNonScript) : preserves non-script nodes', () => {
      const html = '<script>undefined()</script><div></div>'
      expect(cheerio.parseHTML(html)[0].tagName).to.match(/div/i)
    })

    it('(scriptAndNonScript, true) : Preserves script position', () => {
      const html = '<script>undefined()</script><div></div>'
      expect(cheerio.parseHTML(html, true)[0].tagName).to.match(/script/i)
    })

    it('(text) : returns a text node', () => {
      expect(cheerio.parseHTML('text')[0].type).to.be('text')
    })

    it('(\\ttext) : preserves leading whitespace', () => {
      expect(cheerio.parseHTML('\t<div></div>')[0].data).to.equal('\t')
    })

    it('( text) : Leading spaces are treated as text nodes', () => {
      expect(cheerio.parseHTML(' <div/> ')[0].type).to.be('text')
    })

    it('(html) : should preserve content', () => {
      const html = '<div>test div</div>'
      expect(cheerio(cheerio.parseHTML(html)[0]).html()).to.equal('test div')
    })

    it('(malformedHtml) : should not break', () => {
      expect(cheerio.parseHTML('<span><span>')).to.have.length(1)
    })

    it('(garbageInput) : should not cause an error', () => {
      expect(cheerio.parseHTML('<#if><tr><p>This is a test.</p></tr><#/if>') || true).to.be.ok()
    })

    it('(text) : should return an array that is not effected by DOM manipulation methods', () => {
      const $ = cheerio.load('<div>')
      const elems = $.parseHTML('<b></b><i></i>')

      $('div').append(elems)
      expect(elems).to.have.length(2)
    })
  })

  describe('.contains', () => {
    let $

    beforeEach(() => {
      $ = cheerio.load(fixtures.food)
    })

    it('(container, contained) : should correctly detect the provided element', () => {
      const $food = $('#food')
      const $fruits = $('#fruits')
      const $apple = $('.apple')

      expect($.contains($food[0], $fruits[0])).to.equal(true)
      expect($.contains($food[0], $apple[0])).to.equal(true)
    })

    it('(container, other) : should not detect elements that are not contained', () => {
      const $fruits = $('#fruits')
      const $vegetables = $('#vegetables')
      const $apple = $('.apple')

      expect($.contains($vegetables[0], $apple[0])).to.equal(false)
      expect($.contains($fruits[0], $vegetables[0])).to.equal(false)
      expect($.contains($vegetables[0], $fruits[0])).to.equal(false)
      expect($.contains($fruits[0], $fruits[0])).to.equal(false)
      expect($.contains($vegetables[0], $vegetables[0])).to.equal(false)
    })
  })

  describe('.root', () => {
    it('() : should return a cheerio-wrapped root object', () => {
      const $html = cheerio.load('<div><span>foo</span><span>bar</span></div>')
      $html.root().append('<div id="test"></div>')
      expect($html.html()).to.equal('<div><span>foo</span><span>bar</span></div><div id="test"></div>')
    })
  })
})
