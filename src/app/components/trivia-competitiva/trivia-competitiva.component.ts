import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import html2canvas from 'html2canvas';
import { Cuestionario } from 'src/app/models/cuestionario';
import { Pregunta } from 'src/app/models/pregunta';
import { RespuestaOpcion } from 'src/app/models/respuesta-opcion';
import { PreguntaRespuesta } from 'src/app/models/pregunta-respuesta';
import { CuestionarioService } from 'src/app/services/cuestionario.service';
import { PreguntaService } from 'src/app/services/pregunta.service';
import { RespuestaService } from 'src/app/services/respuesta.service';
import { PreguntaRespuestaService } from 'src/app/services/pregunta-respuesta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Respuesta } from 'src/app/models/respuesta';
import { RespuestaCuestionario } from 'src/app/models/respuesta-cuestionario';
import { ResultadosReportesService } from 'src/app/services/resultados-reportes.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trivia-competitiva',
  templateUrl: './trivia-competitiva.component.html',
  styleUrls: ['./trivia-competitiva.component.css'],
})
export class TriviaCompetitivaComponent implements OnInit {
  formularioEstudiante!: FormGroup;
  formulario!: FormGroup;
  cuestionario!: Cuestionario;
  listadoPreguntas: Pregunta[] = [];
  listadoOpciones: RespuestaOpcion[] = [];
  listadoPreguntaRespuestas: Array<PreguntaRespuesta[]> = new Array();
  listadoRespuestas: Array<PreguntaRespuesta[]> = new Array();
  flag: boolean = false;
  cuestionarioToken!: string;
  estudianteCodigo!: number;
  calificacion!: number;

  cloudinaryUploadUrl =
    'https://api.cloudinary.com/v1_1/df4xfvk4i/image/upload'; // Cambia YOUR_CLOUD_NAME
  uploadPreset = 'ml_default'; // Cambia esto por el upload preset que configures en Cloudinary

  @ViewChild('captureElement') captureElement!: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    public cuestionarioService: CuestionarioService,
    public preguntaService: PreguntaService,
    public respuestaService: RespuestaService,
    public preguntaRespuestaService: PreguntaRespuestaService,
    public resultadosReportesService: ResultadosReportesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cuestionarioToken = params['token'];
    });
    this.crearFormularioEstudiante();
    this.obtenerCuestionario();
  }

  ngOnInit() {
    this.setupNombreChange();
  }

  takeScreenshotAndUpload(platform?: string) {
    const element = document.querySelector('.swal2-popup') as HTMLElement;

    html2canvas(element).then((canvas) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', this.uploadPreset);

          this.http.post(this.cloudinaryUploadUrl, formData).subscribe(
            (response: any) => {
              const imageUrl = response.secure_url;
              if (platform === 'twitter') this.shareOnTwitter(imageUrl);
              else if (platform === 'linkedin') this.shareOnLinkedIn(imageUrl);
              else if (platform === 'whatsapp') this.shareOnWhatsApp(imageUrl);
              else this.shareOnFacebook(imageUrl);
            },
            (error) => {
              console.error('Error al subir la imagen a Cloudinary:', error);
            }
          );
        }
      });
    });
  }

  shareOnFacebook(imageUrl: string) {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      imageUrl
    )}`;
    window.open(facebookShareUrl, '_blank');
  }

  shareOnTwitter(imageUrl: string) {
    const text = encodeURIComponent(
      '¡He completado la trivia ' +
        this.cuestionario.nombre +
        ' de Ciberseguridad en línea con éxito! 🔒🌐 Descubre mi resultado:'
    );
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      imageUrl
    )}&text=${text}`;
    window.open(twitterShareUrl, '_blank');
  }

  shareOnLinkedIn(imageUrl: string) {
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      imageUrl
    )}`;
    window.open(linkedInShareUrl, '_blank');
  }

  shareOnWhatsApp(imageUrl: string) {
    const message = encodeURIComponent(
      '¡He completado la trivia ' +
        this.cuestionario.nombre +
        ' de Ciberseguridad en línea con éxito! Descubre mi resultado:'
    );
    const whatsappShareUrl = `https://wa.me/?text=${message}%20${encodeURIComponent(
      imageUrl
    )}`;
    window.open(whatsappShareUrl, '_blank');
  }

  private crearFormularioEstudiante(): void {
    this.formularioEstudiante = this.formBuilder.group({
      nombre: new FormControl('', Validators.required),
    });
  }

  private setupNombreChange(): void {
    this.formularioEstudiante.get('nombre')?.valueChanges.subscribe((value) => {
      const uppercaseValue = value.toUpperCase();
      if (value !== uppercaseValue) {
        this.formularioEstudiante
          .get('nombre')
          ?.setValue(uppercaseValue, { emitEvent: false });
      }
    });
  }

  obtenerCuestionario(): void {
    this.cuestionarioService
      .obtenerCuestionarioToken(this.cuestionarioToken)
      .subscribe(
        (data) => {
          if (JSON.stringify(data) != '[]') {
            this.cuestionario = data;
            this.listarPreguntasCuestionario();
          }
        },
        (error) => {
          // Maneja el error aquí y muestra una alerta con SweetAlert
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            timer: 8000, // Tiempo en milisegundos (5 segundos)
            timerProgressBar: true,
            showConfirmButton: false,
            text: 'No se puede obtener la trivia. Por favor, revise el token suministrado o si la trivia sigue vigente.',
          }).then(() => {
            // Redirigir a la URL cuando el temporizador termina
            this.router.navigate(['/inicio']);
          });
        }
      );
  }

  generarEstudiante(): void {
    let respuestaCuestionario: RespuestaCuestionario =
      new RespuestaCuestionario();
    respuestaCuestionario.estudianteNombre =
      this.formularioEstudiante.get('nombre')!.value;
    respuestaCuestionario.cuestionarioCodigo = this.cuestionario.codigo;

    this.registrarEstudiante(respuestaCuestionario);
  }

  registrarEstudiante(respuestaCuestionario: RespuestaCuestionario) {
    this.respuestaService
      .registrarRespuestaCuestionario(respuestaCuestionario)
      .subscribe(
        (data) => {
          if (data > 0) {
            this.cargarRespuestas();
          } else {
            this.mensajeError();
          }
        },
        (err) => this.fError(err)
      );
  }

  listarPreguntasCuestionario() {
    this.preguntaService
      .obtenerPreguntasCuestionario(this.cuestionario.codigo)
      .subscribe((data) => {
        this.listadoPreguntas = data;
        for (const pregunta of data) {
          this.preguntaRespuestaService
            .obtenerPreguntaRespuestas(pregunta.codigo)
            .subscribe((data) => {
              this.listadoPreguntaRespuestas.push(data);
              this.listadoPreguntaRespuestas[pregunta.codigo] = data;
            });
        }
        this.crearFormularioCuestionario();
      });
  }

  crearFormularioCuestionario() {
    this.formulario = this.formBuilder.group({});
    for (const pregunta of this.listadoPreguntas) {
      this.formulario.addControl(
        `respuesta${pregunta.codigo}`,
        new FormControl('', Validators.required)
      );
    }
  }

  salir() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-ciber-v',
        cancelButton: 'btn btn-danger ml-3',
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: '¡Advertencia!',
        text: 'Está a punto de salir de la trivia, si decides proceder sin guardar estos cambios, se perderán permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Permanecer',
        cancelButtonText: 'Regresar',
        reverseButtons: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire(
            'Termina tu proceso',
            'Desarrolla a cabalidad la encuesta.',
            'success'
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire(
            'Trivias',
            'Los cambios no se han guardado.',
            'warning'
          );
          this.router.navigate(['/trivias', this.cuestionario.cursoCodigo]);
        }
      });
  }

  cargarRespuestas() {
    this.respuestaService.obtenerUltimoRegistro().subscribe((data) => {
      this.estudianteCodigo = data;
      if (this.formulario.valid) {
        // Recoge las respuestas
        const respuestas: Respuesta[] = [];
        let calificacionTotal = 0;
        for (const pregunta of this.listadoPreguntas) {
          const respuesta = new Respuesta();
          respuesta.preguntaCodigo = pregunta.codigo;
          respuesta.preguntaRespuestaCodigo = this.formulario.get(
            `respuesta${pregunta.codigo}`
          )?.value;
          // Obtener la opción seleccionada para esta pregunta
          const opcionSeleccionada = this.listadoPreguntaRespuestas[
            pregunta.codigo
          ].find(
            (opcion) => opcion.codigo === respuesta.preguntaRespuestaCodigo
          );

          if (opcionSeleccionada) {
            respuesta.puntuacion = opcionSeleccionada.puntuacion;
            calificacionTotal += opcionSeleccionada.puntuacion;
          }
          let respuestaTriva: Respuesta = new Respuesta();
          respuestaTriva.respuestaCuestionarioCodigo = this.estudianteCodigo;
          respuestaTriva.preguntaCodigo = respuesta.preguntaCodigo;
          respuestaTriva.preguntaRespuestaCodigo =
            respuesta.preguntaRespuestaCodigo;
          this.registrarTriva(respuestaTriva);
        }

        let respuestaCuestionario: RespuestaCuestionario =
          new RespuestaCuestionario();
        respuestaCuestionario.codigo = this.estudianteCodigo;
        respuestaCuestionario.calificacionTotal = calificacionTotal;
        this.respuestaService
          .actualizarCalificacion(respuestaCuestionario)
          .subscribe((data) => {
            if (data > 0) {
            } else {
              this.mensajeError();
            }
          });

        let titulo = this.cuestionario.nombre;

        Swal.fire({
          title: titulo,
          width: 600,
          padding: '3em',
          color: '#ffffff',
          background: '#282828',
          html: `
              <div style="border: 3px solid #00C853; border-radius: 15px; padding: 20px; text-align: center;">
                <h2 style="color: #00C853; margin-bottom: 15px;">¡Felicidades, ${
                  this.formularioEstudiante.get('nombre')!.value
                }!</h2>
                <p style="font-size: 18px; color: #e0e0e0; margin-bottom: 20px;">Tu calificación final es:</p>
                <h1 style="color: #00C853; font-size: 42px; margin: 0 0 15px;">${calificacionTotal} puntos</h1>
                <img src="assets/images/login.png" alt="Logo" style="width: 250px; margin: 15px auto; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                  <button id="facebook-share-btn" style="background: none; border: none; cursor: pointer;">
                    <i class="fab fa-facebook-f" style="color: #1877f2; font-size: 28px;"></i>
                  </button>
                  <button id="twitter-share-btn" style="background: none; border: none; cursor: pointer;">
                    <i class="fab fa-twitter" style="color: #1DA1F2; font-size: 28px;"></i>
                  </button>
                  <button id="linkedin-share-btn" style="background: none; border: none; cursor: pointer;">
                    <i class="fab fa-linkedin-in" style="color: #0077b5; font-size: 28px;"></i>
                  </button>
                  <button id="whatsapp-share-btn" style="background: none; border: none; cursor: pointer;">
                    <i class="fab fa-whatsapp" style="color: #25D366; font-size: 28px;"></i>
                  </button>
                </div>
              </div>
            `,
          showConfirmButton: false,
          allowOutsideClick: true,
          allowEscapeKey: false,
          allowEnterKey: false,
          willClose: () => {
            this.router.navigate(['/trivias', this.cuestionario.cursoCodigo]);
          },
        });

        setTimeout(() => {
          document
            .getElementById('facebook-share-btn')
            ?.addEventListener('click', () => this.takeScreenshotAndUpload());
          document
            .getElementById('twitter-share-btn')
            ?.addEventListener('click', () =>
              this.takeScreenshotAndUpload('twitter')
            );
          document
            .getElementById('linkedin-share-btn')
            ?.addEventListener('click', () =>
              this.takeScreenshotAndUpload('linkedin')
            );
          document
            .getElementById('whatsapp-share-btn')
            ?.addEventListener('click', () =>
              this.takeScreenshotAndUpload('whatsapp')
            );
        }, 0);
      } else {
        Swal.fire('Error', 'Por favor, complete todas las preguntas', 'error');
      }
    });
  }

  registrarTriva(respuesta: Respuesta) {
    this.respuestaService.registrarRespuestaTrivia(respuesta).subscribe(
      (data) => {
        if (data <= 0) {
          this.mensajeError();
        }
      },
      (err) => this.fError(err)
    );
  }

  mensajeError() {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo completar el proceso.',
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      confirmButtonColor: '#8f141b',
    });
  }

  mensajeSuccses() {
    Swal.fire({
      icon: 'success',
      title: 'Proceso realizado',
      text: '¡Operación exitosa!',
      showConfirmButton: false,
      timer: 2500,
    });
  }

  fError(er: any): void {
    let err = er.error.error_description;
    let arr: string[] = err.split(':');
    if (arr[0] == 'Access token expired') {
      this.router.navigate(['login']);
    } else {
      this.mensajeError();
    }
  }
}
