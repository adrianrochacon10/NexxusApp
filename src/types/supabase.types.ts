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
      businesses: Table<
        {
          id: string
          name: string
          slug: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          name: string
          slug?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          name?: string
          slug?: string | null
          updated_at?: string
        }
      >
      business_memberships: Table<
        {
          id: string
          business_id: string
          user_id: string
          role: "admin"
          status: "active" | "invited" | "disabled"
          invited_by: string | null
          joined_at: string | null
          created_at: string
        },
        {
          id?: string
          business_id: string
          user_id: string
          role?: "admin"
          status?: "active" | "invited" | "disabled"
          invited_by?: string | null
          joined_at?: string | null
          created_at?: string
        },
        {
          role?: "admin"
          status?: "active" | "invited" | "disabled"
          invited_by?: string | null
          joined_at?: string | null
        }
      >
      perfiles: Table<
        {
          id: string
          nombre: string | null
          empresa: string | null
          logo_url: string | null
          plan: "free" | "pro" | "enterprise"
          created_at: string
          updated_at: string
        },
        {
          id: string
          nombre?: string | null
          empresa?: string | null
          logo_url?: string | null
          plan?: "free" | "pro" | "enterprise"
          created_at?: string
          updated_at?: string
        },
        {
          nombre?: string | null
          empresa?: string | null
          logo_url?: string | null
          plan?: "free" | "pro" | "enterprise"
          updated_at?: string
        }
      >
      categorias: Table<
        {
          id: string
          business_id: string | null
          user_id: string
          nombre: string
          tipo: "producto" | "gasto" | "ingreso"
          icono: string | null
          color: string | null
          atributos_base: string[]
          created_at: string
          updated_at: string
        },
        {
          id?: string
          business_id?: string | null
          user_id: string
          nombre: string
          tipo: "producto" | "gasto" | "ingreso"
          icono?: string | null
          color?: string | null
          atributos_base?: string[]
          created_at?: string
          updated_at?: string
        },
        {
          nombre?: string
          tipo?: "producto" | "gasto" | "ingreso"
          icono?: string | null
          color?: string | null
          atributos_base?: string[]
          updated_at?: string
        }
      >
      productos: Table<
        {
          id: string
          business_id: string | null
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
          atributos: Json
          created_at: string
          updated_at: string
        },
        {
          id?: string
          business_id?: string | null
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
          atributos?: Json
          created_at?: string
          updated_at?: string
        },
        {
          business_id?: string | null
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
          atributos?: Json
          updated_at?: string
        }
      >
      producto_variantes: Table<
        {
          id: string
          business_id: string | null
          producto_id: string
          nombre: string
          sku: string | null
          atributos: Json
          stock: number
          stock_minimo: number
          estatus: "disponible" | "pausado" | "agotado"
          created_at: string
          updated_at: string
        },
        {
          id?: string
          business_id?: string | null
          producto_id: string
          nombre: string
          sku?: string | null
          atributos?: Json
          stock?: number
          stock_minimo?: number
          estatus?: "disponible" | "pausado" | "agotado"
          created_at?: string
          updated_at?: string
        },
        {
          nombre?: string
          sku?: string | null
          atributos?: Json
          stock?: number
          stock_minimo?: number
          estatus?: "disponible" | "pausado" | "agotado"
          updated_at?: string
        }
      >
      movimientos_stock: Table<
        {
          id: string
          business_id: string | null
          producto_id: string
          variante_id: string | null
          user_id: string
          tipo: "entrada" | "salida" | "ajuste" | "venta" | "cancelacion"
          cantidad: number
          stock_antes: number
          stock_despues: number
          notas: string | null
          referencia_tipo: string | null
          referencia_id: string | null
          created_at: string
        },
        {
          id?: string
          business_id?: string | null
          producto_id: string
          variante_id?: string | null
          user_id: string
          tipo: "entrada" | "salida" | "ajuste" | "venta" | "cancelacion"
          cantidad: number
          stock_antes: number
          stock_despues: number
          notas?: string | null
          referencia_tipo?: string | null
          referencia_id?: string | null
          created_at?: string
        }
      >
      ventas: Table<
        {
          id: string
          business_id: string | null
          user_id: string
          folio: string
          fecha: string
          hora: string
          subtotal: number
          descuento: number
          total: number
          monto_pagado: number
          saldo_pendiente: number
          forma_pago_inicial: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          estado_pago: "pagada" | "parcial" | "pendiente"
          estatus: "activa" | "cancelada"
          cliente_nombre: string | null
          cliente_telefono: string | null
          notas: string | null
          cancelada_at: string | null
          cancelada_por: string | null
          motivo_cancelacion: string | null
          created_at: string
          updated_at: string
        },
        {
          id?: string
          business_id?: string | null
          user_id: string
          folio: string
          fecha?: string
          hora?: string
          subtotal?: number
          descuento?: number
          total: number
          monto_pagado?: number
          saldo_pendiente?: number
          forma_pago_inicial?: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          estado_pago?: "pagada" | "parcial" | "pendiente"
          estatus?: "activa" | "cancelada"
          cliente_nombre?: string | null
          cliente_telefono?: string | null
          notas?: string | null
          cancelada_at?: string | null
          cancelada_por?: string | null
          motivo_cancelacion?: string | null
          created_at?: string
          updated_at?: string
        },
        {
          monto_pagado?: number
          saldo_pendiente?: number
          estado_pago?: "pagada" | "parcial" | "pendiente"
          estatus?: "activa" | "cancelada"
          notas?: string | null
          cancelada_at?: string | null
          cancelada_por?: string | null
          motivo_cancelacion?: string | null
          updated_at?: string
        }
      >
      venta_lineas: Table<
        {
          id: string
          business_id: string | null
          venta_id: string
          producto_id: string
          variante_id: string | null
          producto_nombre: string
          variante_nombre: string | null
          cantidad: number
          precio_unitario: number
          subtotal: number
          created_at: string
        },
        {
          id?: string
          business_id?: string | null
          venta_id: string
          producto_id: string
          variante_id?: string | null
          producto_nombre: string
          variante_nombre?: string | null
          cantidad: number
          precio_unitario: number
          subtotal: number
          created_at?: string
        }
      >
      venta_pagos: Table<
        {
          id: string
          business_id: string | null
          venta_id: string
          user_id: string
          monto: number
          forma_pago: "efectivo" | "transferencia" | "tarjeta"
          notas: string | null
          created_at: string
        },
        {
          id?: string
          business_id?: string | null
          venta_id: string
          user_id: string
          monto: number
          forma_pago: "efectivo" | "transferencia" | "tarjeta"
          notas?: string | null
          created_at?: string
        }
      >
      transacciones: Table<
        {
          id: string
          business_id: string | null
          user_id: string
          fecha: string
          concepto: string
          categoria_id: string | null
          cantidad: number
          forma_pago: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          monto: number
          tipo: "ingreso" | "gasto" | "transferencia"
          producto_id: string | null
          venta_id: string | null
          venta_pago_id: string | null
          notas: string | null
          created_at: string
        },
        {
          id?: string
          business_id?: string | null
          user_id: string
          fecha?: string
          concepto: string
          categoria_id?: string | null
          cantidad?: number
          forma_pago?: "efectivo" | "transferencia" | "adeudo" | "tarjeta" | null
          monto: number
          tipo: "ingreso" | "gasto" | "transferencia"
          producto_id?: string | null
          venta_id?: string | null
          venta_pago_id?: string | null
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
