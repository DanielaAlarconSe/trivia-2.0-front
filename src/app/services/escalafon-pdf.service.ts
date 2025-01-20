import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { DatePipe } from '@angular/common';
import { Calificacion } from '../models/calificacion';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Injectable({
  providedIn: 'root',
})
export class EscalafonPdfService {
  header: any;
  footer: any;
  arreglo: any = [];

  constructor(private http: HttpClient, private datePipe: DatePipe) {
    this.hedaerBase64();
    this.footerBase64();
  }

  hedaerBase64() {
    const imagePath = 'assets/images/header.jpg';
    this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        this.header = base64data;
      };
    });
  }

  footerBase64() {
    const imagePath = 'assets/images/footer.jpg';
    this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        this.footer = base64data;
      };
    });
  }

  public export(element: Calificacion[]): void {
    for (let index = 0; index < element.length; index++) {
      this.arreglo.push([
        { text: index + 1 },
        { text: element[index].estudianteNombre },
        { text: element[index].cursoNombre },
        { text: element[index].cuestionarioNombre },
        { text: element[index].calificacion },
      ]);
    }

    const docDefinition: any = {
      background: [
        {
          image: this.footer,
          width: 600,
          height: 120,
          alignment: 'center',
          margin: [0, 704, 0, 0],
        },
      ],
      pageMargins: [40, 110, 40, 17.8],
      header: {
        margin: [0, 0, 0, 0],
        image: this.header,
        width: 600,
        height: 90,
      },
      footer: function (
        currentPage: { toString: () => string },
        pageCount: string
      ) {
        const dia = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const d = new Date();
        const date =
          ' ' + dia[d.getDay() - 1] + ' ' + d.getDate() + ' ' + mes[d.getMonth()] + ' ' + d.getFullYear();
        return {
          margin: [0, 0, 0, 0],
          style: 'footer',
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'Fecha de impresión:  ' + date,
                  fillColor: '#00181a',
                  bold: true,
                  alignment: 'left',
                },
                {
                  border: [false, false, false, false],
                  text: 'Página: ' + currentPage.toString() + ' de ' + pageCount,
                  fillColor: '#00181a',
                  bold: true,
                  alignment: 'right',
                },
              ],
            ],
          },
        };
      },
      content: [
        {
          text: 'Reporte Escalafón de Estudiantes',
          style: 'reportTitle',
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515, // Ancho de la página
              y2: 0,
              lineWidth: 1.5,
              lineColor: '#000000',
            },
          ],
          margin: [0, 10, 0, 20],
        },
        {
          style: 'tableInit',
          table: {
            dontBreakRows: true,
            unbreakable: true,
            widths: [40, '*', 'auto', 'auto', 'auto'],
            heights: 20,
            headerRows: 2,
            body: [
              [
                {
                  text: 'Puesto',
                  fillColor: '#000000',
                  color: 'white',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Estudiante',
                  fillColor: '#000000',
                  color: 'white',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Curso',
                  fillColor: '#000000',
                  color: 'white',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Trivia',
                  fillColor: '#000000',
                  color: 'white',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Calificación',
                  fillColor: '#000000',
                  color: 'white',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
              ],
              ...this.arreglo.map((row: any[]) =>
                row.map((cell: { text: any }) => ({
                  text: cell.text,
                  margin: 4,
                }))
              ),
            ],
          },
        },
      ],
      styles: {
        reportTitle: {
          fontSize: 20,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        footer: {
          color: '#FFFFFF',
          fontSize: 10,
          bold: true,
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 0],
          alignment: 'center',
        },
        tableExample: {
          margin: [0, 5, 0, 5],
          fontSize: 10,
          alignment: 'center',
        },
        tableInit: {
          margin: [0, 10, 0, 5],
          fontSize: 10,
          alignment: 'center',
        },
      },
    };

    pdfMake
      .createPdf(docDefinition)
      .download(
        'Reporte Escalafón ' +
          this.datePipe.transform(new Date(), 'dd-MM-yyyy h:mm a') +
          ' .pdf'
      );
  }
}
