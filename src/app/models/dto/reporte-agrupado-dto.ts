export class ReporteAgrupadoDto {
  estudianteNombre!: string;
  fechaRegistro!: string;
  columnas!: {
    [key: string]: string | null;
  };
  calificacion!: number;
}
