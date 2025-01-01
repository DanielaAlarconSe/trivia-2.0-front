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
import { AsginacionService } from '../../services/asginacion.service';
import { AuthService } from 'src/app/services/auth.service';
import { SeguimientoService } from '../../services/seguimiento.service';
import { EmailNotificacionDto } from 'src/app/models/dto/email-notificacion-dto';

@Component({
  selector: 'app-trivia-diagnostica',
  templateUrl: './trivia-diagnostica.component.html',
  styleUrls: ['./trivia-diagnostica.component.css'],
})
export class TriviaDiagnosticaComponent {
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
  aspirante: any = {};

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
    private http: HttpClient,
    private asginacionService: AsginacionService,
    private authservice: AuthService,
    private seguimientoService: SeguimientoService
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.cuestionarioToken = params['token'];
    });
  }

  ngOnInit() {
    this.crearFormularioEstudiante();
    this.obtenerCuestionario();
    this.setupNombreChange();
    this.asginacionService
      .obtenerAspirante(this.authservice.user.codigo)
      .subscribe((data) => {
        console.log(data);
        this.aspirante = Array.isArray(data) ? data[0] : data;
        this.formularioEstudiante
          .get('nombre')!
          .setValue(
            this.aspirante.personaNombre + ' ' + this.aspirante.personaApellido
          );
      });
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
    this.respuestaService.validarIp().subscribe((data) => {
      if (data == false) {
        let respuestaCuestionario: RespuestaCuestionario =
          new RespuestaCuestionario();
        respuestaCuestionario.estudianteNombre =
          this.formularioEstudiante.get('nombre')!.value;
        respuestaCuestionario.cuestionarioCodigo = this.cuestionario.codigo;

        this.registrarEstudiante(respuestaCuestionario);
      } else {
        Swal.fire({
          icon: 'error',
          title: '¡Acceso denegado!',
          text: 'Tu dirección IP está restringida. No puedes participar en esta trivia.',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#e61919',
        });
        this.router.navigate(['/inicio']);
      }
    });
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

  logout(): void {
    this.authservice.logout();
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: 'success',
      title: 'Sesión cerrada correctamente',
    });
    this.router.navigate(['/inicio']);
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
              let email: EmailNotificacionDto = new EmailNotificacionDto();
              email.destinatarioEntidad = this.aspirante.entidadEmail;
              email.aspiranteNombre =
                this.aspirante.personaNombre +
                ' ' +
                this.aspirante.personaApellido;
              email.entidadNombre = this.aspirante.entidadNombre;
              const formatFecha = (fecha: string | Date): string => {
                // Asegurar que sea una instancia de Date
                const fechaObj =
                  fecha instanceof Date ? fecha : new Date(fecha);

                const opcionesFecha: Intl.DateTimeFormatOptions = {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                };
                const opcionesHora: Intl.DateTimeFormatOptions = {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                };

                const fechaFormateada: string = fechaObj.toLocaleDateString(
                  'es-ES',
                  opcionesFecha
                );
                const horaFormateada: string = fechaObj.toLocaleTimeString(
                  'es-ES',
                  opcionesHora
                );

                return `${fechaFormateada} ${horaFormateada}`;
              };

              // Uso en tu método
              email.fechaRegistro = formatFecha(new Date());
              email.cuestionarioNombre = this.aspirante.cuestionarioNombre;
              1;
              email.puntaje = calificacionTotal + '';
              console.log(email);

              this.seguimientoService
                .emailNotificacionEntidad(email)
                .subscribe((data) => {
                  console.log(data);
                });
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
              </div>
            `,
          showConfirmButton: false,
          allowOutsideClick: true,
          allowEscapeKey: false,
          allowEnterKey: false,
          willClose: () => {
            this.logout();
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
