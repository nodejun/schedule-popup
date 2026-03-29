import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  findElement,
  findAllElements,
  waitForElement,
  createShadowContainer,
  replaceWithElement,
  restoreHiddenElements,
  isDarkTheme,
} from '@/content/utils/dom-helpers'

describe('findElement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('첫 번째 매칭 셀렉터의 요소를 반환한다', () => {
    document.body.innerHTML = '<div id="target" class="test-class"></div>'

    const result = findElement(['#target', '.test-class'] as any)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('target')
  })

  it('첫 번째 셀렉터 실패 시 다음 셀렉터로 폴백한다', () => {
    document.body.innerHTML = '<div class="fallback"></div>'

    const result = findElement(['#nonexistent', '.fallback'] as any)
    expect(result).not.toBeNull()
    expect(result?.className).toBe('fallback')
  })

  it('모든 셀렉터 실패 시 null을 반환한다', () => {
    document.body.innerHTML = '<div></div>'

    const result = findElement(['#nope', '.nope'] as any)
    expect(result).toBeNull()
  })

  it('지정된 루트 노드 내에서 검색한다', () => {
    document.body.innerHTML = `
      <div id="container">
        <span class="inside">inner</span>
      </div>
      <span class="outside">outer</span>
    `

    const container = document.getElementById('container')!
    const result = findElement(['.inside'] as any, container)
    expect(result).not.toBeNull()

    // outside는 container 밖이므로 찾으면 안 됨
    const outside = findElement(['.outside'] as any, container)
    expect(outside).toBeNull()
  })
})

describe('findAllElements', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('여러 셀렉터에 매칭되는 모든 요소를 반환한다', () => {
    document.body.innerHTML = `
      <div class="a">1</div>
      <div class="b">2</div>
      <div class="c">3</div>
    `

    const result = findAllElements(['.a', '.b'] as any)
    expect(result).toHaveLength(2)
  })

  it('중복 요소를 제거한다', () => {
    document.body.innerHTML = '<div id="dup" class="dup"></div>'

    // 같은 요소를 두 셀렉터가 모두 매칭
    const result = findAllElements(['#dup', '.dup'] as any)
    expect(result).toHaveLength(1)
  })

  it('매칭이 없으면 빈 배열을 반환한다', () => {
    document.body.innerHTML = '<div></div>'

    const result = findAllElements(['.nonexistent'] as any)
    expect(result).toHaveLength(0)
  })
})

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('이미 존재하는 요소를 즉시 반환한다', async () => {
    document.body.innerHTML = '<div id="exists"></div>'

    const result = await waitForElement(['#exists'] as any)
    expect(result).not.toBeNull()
    expect((result as HTMLElement).id).toBe('exists')
  })

  it('나중에 추가된 요소를 감지한다', async () => {
    const promise = waitForElement(['#later'] as any, { timeout: 2000 })

    // 비동기로 요소 추가
    setTimeout(() => {
      const el = document.createElement('div')
      el.id = 'later'
      document.body.appendChild(el)
    }, 50)

    const result = await promise
    expect(result).not.toBeNull()
    expect((result as HTMLElement).id).toBe('later')
  })

  it('타임아웃 시 null을 반환한다', async () => {
    const result = await waitForElement(['#never'] as any, {
      timeout: 100,
    })
    expect(result).toBeNull()
  })
})

describe('createShadowContainer', () => {
  it('Shadow DOM 컨테이너를 생성한다', () => {
    const { host, shadowRoot, mountPoint } = createShadowContainer('test')

    expect(host.id).toBe('short-scheduler-test')
    expect(shadowRoot).toBeDefined()
    expect(mountPoint.id).toBe('mount-point')
  })

  it('adoptedStyleSheets로 스타일이 주입된다', () => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync('.widget { color: red; }')
    const { shadowRoot } = createShadowContainer('styled', [sheet])

    expect(shadowRoot.adoptedStyleSheets).toHaveLength(1)
    expect(shadowRoot.adoptedStyleSheets[0]).toBe(sheet)
  })

  it('스타일시트 없이도 동작한다', () => {
    const { shadowRoot } = createShadowContainer('no-style')

    // jsdom은 adoptedStyleSheets를 완전히 지원하지 않을 수 있음
    // 스타일시트를 전달하지 않았으므로, 설정되지 않았거나 빈 배열이어야 함
    const sheets = shadowRoot.adoptedStyleSheets
    expect(!sheets || sheets.length === 0).toBe(true)
  })

  it('host에 CSS 리셋이 적용된다', () => {
    const { host } = createShadowContainer('reset')

    expect(host.style.all).toBe('initial')
    expect(host.style.display).toBe('block')
  })
})

describe('replaceWithElement / restoreHiddenElements', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('대상을 숨기고 대체 요소를 삽입한다', () => {
    const target = document.createElement('div')
    target.id = 'original'
    document.body.appendChild(target)

    const replacement = document.createElement('div')
    replacement.id = 'replacement'

    replaceWithElement(target, replacement)

    expect(target.style.display).toBe('none')
    expect(target.getAttribute('data-short-scheduler-hidden')).toBe('true')
    expect(document.getElementById('replacement')).not.toBeNull()
  })

  it('숨긴 요소를 복원하고 위젯을 제거한다', () => {
    // 시뮬레이션: 이미 교체된 상태
    document.body.innerHTML = `
      <div id="short-scheduler-widget">widget</div>
      <div id="original" style="display: none;" data-short-scheduler-hidden="true">original</div>
    `

    restoreHiddenElements()

    const original = document.getElementById('original')!
    expect(original.style.display).toBe('')
    expect(original.hasAttribute('data-short-scheduler-hidden')).toBe(false)

    const widget = document.getElementById('short-scheduler-widget')
    expect(widget).toBeNull()
  })
})

describe('isDarkTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dark')
  })

  it('dark 속성이 있으면 true를 반환한다', () => {
    document.documentElement.setAttribute('dark', '')
    expect(isDarkTheme()).toBe(true)
  })

  it('dark 속성이 없으면 false를 반환한다', () => {
    expect(isDarkTheme()).toBe(false)
  })
})
