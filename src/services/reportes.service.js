import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import * as ReportesModel from '../models/reportes.model.js';
import { generarHTML } from '../utils/reporteTemplate.js';

/**
 * Ejecuta las 4 queries Oracle de forma secuencial (no paralela) para evitar
 * agotar el pool de conexiones bajo carga concurrente.
 */
export async function generarReporte(fechaInicio, fechaFin) {
  const resumen  = await ReportesModel.getResumenPeriodo(fechaInicio, fechaFin);
  const detalle  = await ReportesModel.getDetalleServicios(fechaInicio, fechaFin);
  const ciudades = await ReportesModel.getDistribucionCiudades(fechaInicio, fechaFin);
  const estudios = await ReportesModel.getEstudios(fechaInicio, fechaFin);
  return { resumen, detalle, ciudades, estudios };
}

/**
 * Genera PDF usando Puppeteer (Chrome headless).
 * browser.close() está en finally para evitar que Chrome quede colgado si falla.
 */
export async function generarPDF(data, fechaInicio, fechaFin) {
  const html    = generarHTML(data, { fechaInicio, fechaFin });
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'Letter', printBackground: true });
  } finally {
    await browser.close();
  }
}

/**
 * Genera XLSX con 4 hojas: Resumen, Detalle Servicios, Ciudades, Estudios.
 * Retorna Buffer listo para res.send().
 */
export async function generarXLSX(data) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([data.resumen]), 'Resumen');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.detalle),  'Detalle Servicios');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.ciudades), 'Ciudades');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.estudios), 'Estudios');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
