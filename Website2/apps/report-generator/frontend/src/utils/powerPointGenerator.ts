import PptxGenJS from 'pptxgenjs'
import { ReportData, PowerPointExportOptions } from '@types/index'

export const generatePowerPointReport = (
  reportData: ReportData,
  options: PowerPointExportOptions
): PptxGenJS => {
  const pres = new PptxGenJS()

  // Set presentation properties
  pres.defineLayout({ name: 'MASTER', width: 10, height: 7.5 })
  pres.addSection({ title: reportData.title })

  // Add title slide
  addTitleSlide(pres, reportData, options)

  // Add table of contents if enabled
  if (options.includeTableOfContents) {
    addTableOfContents(pres, reportData)
  }

  // Add content slides
  reportData.sections.forEach((section, index) => {
    const slideNumber = options.includeTableOfContents ? index + 3 : index + 2

    const slide = pres.addSlide()

    if (options.pageNumbers) {
      slide.addText(`${slideNumber}`, {
        x: 9.2,
        y: 7.2,
        w: 0.6,
        h: 0.3,
        fontSize: 10,
        color: '666666',
        align: 'right',
      })
    }

    // Add section title
    slide.addText(section.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: '1f2937',
    })

    // Add section content based on type
    switch (section.type) {
      case 'text':
        addTextSlide(slide, section.content as string)
        break
      case 'table':
        addTableSlide(slide, section.content)
        break
      case 'chart':
        addChartSlide(slide, section.content)
        break
      default:
        break
    }
  })

  // Add metadata slide
  addMetadataSlide(pres, reportData)

  return pres
}

function addTitleSlide(
  pres: PptxGenJS,
  reportData: ReportData,
  _options: PowerPointExportOptions
) {
  const slide = pres.addSlide()

  slide.background = { color: '1f2937' }

  slide.addText(reportData.title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 54,
    bold: true,
    color: 'ffffff',
    align: 'center',
  })

  slide.addText(`Generated on ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: 'e5e7eb',
    align: 'center',
  })

  if (reportData.metadata.tags.length > 0) {
    slide.addText(`Tags: ${reportData.metadata.tags.join(', ')}`, {
      x: 0.5,
      y: 5,
      w: 9,
      h: 0.4,
      fontSize: 12,
      color: '9ca3af',
      align: 'center',
    })
  }
}

function addTableOfContents(pres: PptxGenJS, reportData: ReportData) {
  const slide = pres.addSlide()

  slide.addText('Table of Contents', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '1f2937',
  })

  const tableContent: string[][] = [['#', 'Section']]
  reportData.sections.forEach((section, index) => {
    tableContent.push([(index + 1).toString(), section.title])
  })

  slide.addTable(tableContent, {
    x: 1,
    y: 1.5,
    w: 8,
    colW: [0.8, 7.2],
    border: { pt: 1, color: 'd1d5db' },
    fill: { color: 'f3f4f6' },
  })
}

function addTextSlide(slide: PptxGenJS.Slide, content: string) {
  const lines = content.split('\n').slice(0, 10)
  const maxHeight = 5.5

  slide.addText(lines.join('\n'), {
    x: 0.8,
    y: 1.3,
    w: 8.4,
    h: maxHeight,
    fontSize: 14,
    color: '374151',
    valign: 'top',
    wrap: true,
  })
}

function addTableSlide(slide: PptxGenJS.Slide, content: unknown) {
  if (Array.isArray(content) && content.length > 0) {
    const data = content as Record<string, unknown>[]
    const headers = Object.keys(data[0])
    const tableData: string[][] = [headers]

    data.slice(0, 15).forEach((row) => {
      tableData.push(headers.map((h) => String(row[h] ?? '')))
    })

    slide.addTable(tableData, {
      x: 0.5,
      y: 1.3,
      w: 9,
      colW: headers.map(() => 9 / headers.length),
      border: { pt: 0.5, color: 'd1d5db' },
      fill: { color: 'f3f4f6' },
      fontSize: 11,
    })
  }
}

function addChartSlide(slide: PptxGenJS.Slide, _content: unknown) {
  slide.addText(
    'Chart data visualization placeholder.\nImplement with your charting library.',
    {
      x: 2,
      y: 2.5,
      w: 6,
      h: 2.5,
      fontSize: 14,
      color: '6b7280',
      align: 'center',
    }
  )
}

function addMetadataSlide(pres: PptxGenJS, reportData: ReportData) {
  const slide = pres.addSlide()

  slide.addText('Document Information', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: '1f2937',
  })

  const metadata = [
    [`Title: ${reportData.title}`],
    [`Author: ${reportData.metadata.author}`],
    [`Created: ${reportData.metadata.createdAt.toLocaleDateString()}`],
    [`Version: ${reportData.metadata.version}`],
    [`Sections: ${reportData.sections.length}`],
  ]

  slide.addTable(metadata, {
    x: 1.5,
    y: 1.8,
    w: 7,
    colW: [7],
    border: { pt: 0, color: 'ffffff' },
    fill: { color: 'ffffff' },
    fontSize: 14,
  })
}

export const downloadPowerPoint = (pres: PptxGenJS, filename: string) => {
  pres.save({ fileName: filename })
}
