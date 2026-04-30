export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: []
}

type GenericSupabaseTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: []
}

type GenericSupabaseView = {
  Row: Record<string, unknown>
  Relationships: []
}

type GenericSupabaseFunction = {
  Args: Record<string, unknown> | never
  Returns: unknown
}

export interface Database {
  public: {
    Tables: {
      [key: string]: GenericSupabaseTable
      perfiles: Table<
        {
          id: string
          nombre: string | null
          empresa: string | null
          logo_url: string | null
          plan: "free" | "pro" | "enterprise"
          created_at: string
        },
        {
          id: string
          nombre?: string | null
          empresa?: string | null
          logo_url?: string | null
          plan?: "free" | "pro" | "enterprise"
          created_at?: string
        }
      >
      categorias: Table<
        {
          id: string
          user_id: string
          nombre: string
          tipo: "producto" | "gasto" | "ingreso"
          icono: string | null
          color: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          nombre: string
          tipo: "producto" | "gasto" | "ingreso"
          icono?: string | null
          color?: string | null
          created_at?: string
        }
      >
      productos: Table<
        {
          id: string
          user_id: string
          nombre: string
          descripcion: string | null
          categoria_id: string | null
          precio_venta: number
          precio_costo: number | null
          stock: number
          stock_minimo: number
          imagen_url: string | null
          estatus: "disponible" | "pausado" | "agotado"
          sku: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          user_id: string
          nombre: string
          descripcion?: string | null
          categoria_id?: string | null
          precio_venta: number
          precio_costo?: number | null
          stock?: number
          stock_minimo?: number
          imagen_url?: string | null
          estatus?: "disponible" | "pausado" | "agotado"
          sku?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          nombre?: string
          descripcion?: string | null
          categoria_id?: string | null
          precio_venta?: number
          precio_costo?: number | null
          stock?: number
          stock_minimo?: number
          imagen_url?: string | null
          estatus?: "disponible" | "pausado" | "agotado"
          sku?: string | null
          updated_at?: string
        }
      >
      movimientos_stock: Table<
        {
          id: string
          producto_id: string
          user_id: string
          tipo: "entrada" | "salida" | "ajuste"
          cantidad: number
          stock_antes: number
          stock_despues: number
          notas: string | null
          created_at: string
        },
        {
          id?: string
          producto_id: string
          user_id: string
          tipo: "entrada" | "salida" | "ajuste"
          cantidad: number
          stock_antes: number
          stock_despues: number
          notas?: string | null
          created_at?: string
        }
      >
      transacciones: Table<
        {
          id: string
          user_id: string
          fecha: string
          concepto: string
          categoria_id: string | null
          cantidad: number
          forma_pago: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          monto: number
          tipo: "ingreso" | "gasto" | "transferencia"
          producto_id: string | null
          notas: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          fecha?: string
          concepto: string
          categoria_id?: string | null
          cantidad?: number
          forma_pago?: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          monto: number
          tipo: "ingreso" | "gasto" | "transferencia"
          producto_id?: string | null
          notas?: string | null
          created_at?: string
        }
      >
    }
    Views: {
      [key: string]: GenericSupabaseView
    }
    Functions: {
      [key: string]: GenericSupabaseFunction
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
