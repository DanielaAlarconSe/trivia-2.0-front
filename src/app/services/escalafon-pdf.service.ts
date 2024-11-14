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
    // Ruta de la imagen en "assets"
    const imagePath = 'assets/images/header.jpg';

    // Realiza una solicitud HTTP GET para cargar la imagen como un blob
    this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob) => {
      // Lee el blob como un ArrayBuffer
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => {
        // La imagen se ha cargado y convertido a base64
        const base64data = reader.result as string;
        this.header = base64data;

        // Puedes utilizar base64data como necesites
      };
    });
  }

  footerBase64() {
    // Ruta de la imagen en "assets"
    const imagePath = 'assets/images/footer.jpg';

    // Realiza una solicitud HTTP GET para cargar la imagen como un blob
    this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob) => {
      // Lee el blob como un ArrayBuffer
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => {
        // La imagen se ha cargado y convertido a base64
        const base64data = reader.result as string;
        this.footer = base64data;

        // Puedes utilizar base64data como necesites
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
        let dia = [
          'lunes',
          'martes',
          'miércoles',
          'jueves',
          'viernes',
          'sábado',
          'domingo',
        ];
        let mes = [
          'enero',
          'febrero',
          'marzo',
          'abril',
          'mayo',
          'junio',
          'julio',
          'agosto',
          'septiembre',
          'octubre',
          'noviembre',
          'diciembre',
        ];
        let d = new Date();
        let date =
          ' ' +
          dia[d.getDay() - 1] +
          ' ' +
          d.getDate() +
          ' ' +
          mes[d.getMonth()] +
          ' ' +
          d.getFullYear();
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
                  text:
                    'Pagina: ' + currentPage.toString() + ' de ' + pageCount,
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
          text: '',
          style: 'subheader',
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
