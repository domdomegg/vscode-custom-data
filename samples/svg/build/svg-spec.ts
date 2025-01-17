import * as path from 'path'
import * as fs from 'fs'

const DEFINITION_PATH = path.resolve(__dirname, '../raw-data/definitions.xml')

import * as cheerio from 'cheerio'

interface Reference {
  name: string
  url: string
}

export interface HTMLElement {
  name: string
  description?: string
  attributes: HTMLAttribute[]
  attributeCategories: string[]
  references?: Reference[]
}

export interface HTMLAttribute {
  name: string
  description?: string
  references?: Reference[]
}

interface HTMLAttributeCategory {
  name: string
  attributes: HTMLAttribute[]
  references?: Reference[]
}

export interface CSSProperty {
  name: string
  description?: string
  browsers?: string[]
  status?: string
  syntax?: string
  values?: CSSPropertyValue[]
  references?: Reference[]
}

export interface CSSSpecProperty {
  name: string
  references?: Reference[]
}

export interface CSSPropertyValue {
  name: string
  descriptipn: string
  references?: Reference[]
}

const globalAttributes: HTMLAttribute[] = []
const attributeCategories: HTMLAttributeCategory[] = []
const elements: HTMLElement[] = []
const cssSpecProperties: CSSSpecProperty[] = []

function handleHref(href: string) {
  return href.startsWith('https://') ? href : 'https://www.w3.org/TR/SVG/' + href
}

function parseStringList(str: string) {
  return str.split(',').map(s => s.trim())
}

export function getSVGSpec() {
  const src = fs.readFileSync(DEFINITION_PATH, 'utf-8')
  const $ = cheerio.load(src, {
    xmlMode: true
  })

  $('definitions > attribute').each((_, e) => {
    globalAttributes.push({
      name: e.attribs['name'],
      references: [
        {
          name: 'SVG Spec',
          url: handleHref(e.attribs['href'])
        }
      ]
    })
  })

  $('attributecategory').each((_, e) => {
    const attrCate = {
      name: e.attribs['name'],
      attributes: [] as any,
      references: [
        {
          name: 'SVG Spec',
          url: handleHref(e.attribs['href'])
        }
      ]
    }

    $(e)
      .find('attribute')
      .each((_, e) => {
        attrCate.attributes.push({
          name: e.attribs['name'],
          references: [
            {
              name: 'SVG Spec',
              url: handleHref(e.attribs['href'])
            }
          ]
        })
      })

    attributeCategories.push(attrCate)
  })

  $('element').each((_, e) => {
    const el = {
      name: e.attribs['name'],
      attributes: [] as HTMLAttribute[],
      attributeCategories: [] as string[],
      references: [
        {
          name: 'SVG Spec',
          url: handleHref(e.attribs['href'])
        }
      ]
    }

    if (e.attribs['attributes']) {
      parseStringList(e.attribs['attributes']).forEach(s => {
        const matchingAttr = globalAttributes.find(a => a.name === s)
        if (matchingAttr) {
          el.attributes.push(matchingAttr)
        }
      })
    }

    $(e)
      .find('attribute')
      .each((_, ea) => {
        el.attributes.push({
          name: ea.attribs['name'],
          references: [
            {
              name: 'SVG Spec',
              url: handleHref(ea.attribs['href'])
            }
          ]
        })
      })

    if (e.attribs['attributecategories']) {
      parseStringList(e.attribs['attributecategories']).forEach(s => {
        el.attributeCategories.push(s)
      })
    }

    elements.push(el)
  })

  $('property').each((_, e) => {
    cssSpecProperties.push({
      name: e.attribs['name'],
      references: [
        {
          name: 'SVG Spec',
          url: handleHref(e.attribs['href'])
        }
      ]
    })
  })

  return {
    elements,
    globalAttributes,
    cssSpecProperties
  }
}
