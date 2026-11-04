export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          siguiente_folio: number
          slug: string | null
          updated_at: string
          zona_horaria: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          siguiente_folio?: number
          slug?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          siguiente_folio?: number
          slug?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          atributos_base: string[]
          business_id: string
          clave: string | null
          color: string | null
          created_at: string
          icono: string | null
          id: string
          nombre: string
          tipo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          atributos_base?: string[]
          business_id: string
          clave?: string | null
          color?: string | null
          created_at?: string
          icono?: string | null
          id?: string
          nombre: string
          tipo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          atributos_base?: string[]
          business_id?: string
          clave?: string | null
          color?: string | null
          created_at?: string
          icono?: string | null
          id?: string
          nombre?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_stock: {
        Row: {
          business_id: string
          cantidad: number
          created_at: string
          id: string
          notas: string | null
          producto_id: string
          referencia_id: string | null
          referencia_tipo: string | null
          stock_antes: number
          stock_despues: number
          tipo: string
          user_id: string | null
          variante_id: string | null
        }
        Insert: {
          business_id: string
          cantidad: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          stock_antes: number
          stock_despues: number
          tipo: string
          user_id?: string | null
          variante_id?: string | null
        }
        Update: {
          business_id?: string
          cantidad?: number
          created_at?: string
          id?: string
          notas?: string | null
          producto_id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          stock_antes?: number
          stock_despues?: number
          tipo?: string
          user_id?: string | null
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "producto_variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string
          empresa: string | null
          id: string
          logo_url: string | null
          nombre: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa?: string | null
          id: string
          logo_url?: string | null
          nombre?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      producto_variantes: {
        Row: {
          atributos: Json
          business_id: string
          created_at: string
          id: string
          nombre: string
          producto_id: string
          sku: string | null
          stock: number
          stock_minimo: number
          updated_at: string
        }
        Insert: {
          atributos?: Json
          business_id: string
          created_at?: string
          id?: string
          nombre: string
          producto_id: string
          sku?: string | null
          stock?: number
          stock_minimo?: number
          updated_at?: string
        }
        Update: {
          atributos?: Json
          business_id?: string
          created_at?: string
          id?: string
          nombre?: string
          producto_id?: string
          sku?: string | null
          stock?: number
          stock_minimo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_variantes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_variantes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          atributos: Json
          business_id: string
          categoria_id: string | null
          created_at: string
          descripcion: string | null
          estatus: string
          id: string
          imagen_url: string | null
          nombre: string
          precio_costo: number
          precio_venta: number
          sku: string | null
          stock: number
          stock_minimo: number
          tiene_variantes: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          atributos?: Json
          business_id: string
          categoria_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: string
          id?: string
          imagen_url?: string | null
          nombre: string
          precio_costo?: number
          precio_venta: number
          sku?: string | null
          stock?: number
          stock_minimo?: number
          tiene_variantes?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          atributos?: Json
          business_id?: string
          categoria_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: string
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio_costo?: number
          precio_venta?: number
          sku?: string | null
          stock?: number
          stock_minimo?: number
          tiene_variantes?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          business_id: string
          cantidad: number
          categoria_id: string | null
          concepto: string
          created_at: string
          fecha: string
          forma_pago: string | null
          id: string
          monto: number
          notas: string | null
          origen: string
          producto_id: string | null
          tipo: string
          updated_at: string
          user_id: string | null
          venta_id: string | null
          venta_pago_id: string | null
        }
        Insert: {
          business_id: string
          cantidad?: number
          categoria_id?: string | null
          concepto: string
          created_at?: string
          fecha: string
          forma_pago?: string | null
          id?: string
          monto: number
          notas?: string | null
          origen?: string
          producto_id?: string | null
          tipo: string
          updated_at?: string
          user_id?: string | null
          venta_id?: string | null
          venta_pago_id?: string | null
        }
        Update: {
          business_id?: string
          cantidad?: number
          categoria_id?: string | null
          concepto?: string
          created_at?: string
          fecha?: string
          forma_pago?: string | null
          id?: string
          monto?: number
          notas?: string | null
          origen?: string
          producto_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string | null
          venta_id?: string | null
          venta_pago_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_venta_pago_id_fkey"
            columns: ["venta_pago_id"]
            isOneToOne: true
            referencedRelation: "venta_pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_lineas: {
        Row: {
          business_id: string
          cantidad: number
          costo_unitario: number
          created_at: string
          id: string
          precio_unitario: number
          producto_id: string | null
          producto_nombre: string
          subtotal: number
          variante_id: string | null
          variante_nombre: string | null
          venta_id: string
        }
        Insert: {
          business_id: string
          cantidad: number
          costo_unitario?: number
          created_at?: string
          id?: string
          precio_unitario: number
          producto_id?: string | null
          producto_nombre: string
          subtotal: number
          variante_id?: string | null
          variante_nombre?: string | null
          venta_id: string
        }
        Update: {
          business_id?: string
          cantidad?: number
          costo_unitario?: number
          created_at?: string
          id?: string
          precio_unitario?: number
          producto_id?: string | null
          producto_nombre?: string
          subtotal?: number
          variante_id?: string | null
          variante_nombre?: string | null
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_lineas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_lineas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_lineas_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "producto_variantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_lineas_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_pagos: {
        Row: {
          business_id: string
          created_at: string
          es_inicial: boolean
          forma_pago: string
          id: string
          idempotency_key: string | null
          monto: number
          notas: string | null
          user_id: string | null
          venta_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          es_inicial?: boolean
          forma_pago: string
          id?: string
          idempotency_key?: string | null
          monto: number
          notas?: string | null
          user_id?: string | null
          venta_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          es_inicial?: boolean
          forma_pago?: string
          id?: string
          idempotency_key?: string | null
          monto?: number
          notas?: string | null
          user_id?: string | null
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_pagos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_pagos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          business_id: string
          cancelada_at: string | null
          cancelada_por: string | null
          cliente_nombre: string | null
          cliente_telefono: string | null
          created_at: string
          descuento: number
          estado_pago: string
          estatus: string
          fecha: string
          folio: string
          forma_pago_inicial: string | null
          hora: string
          id: string
          idempotency_key: string
          monto_pagado: number
          motivo_cancelacion: string | null
          notas: string | null
          saldo_pendiente: number
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          cancelada_at?: string | null
          cancelada_por?: string | null
          cliente_nombre?: string | null
          cliente_telefono?: string | null
          created_at?: string
          descuento?: number
          estado_pago?: string
          estatus?: string
          fecha: string
          folio: string
          forma_pago_inicial?: string | null
          hora: string
          id?: string
          idempotency_key: string
          monto_pagado?: number
          motivo_cancelacion?: string | null
          notas?: string | null
          saldo_pendiente?: number
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          cancelada_at?: string | null
          cancelada_por?: string | null
          cliente_nombre?: string | null
          cliente_telefono?: string | null
          created_at?: string
          descuento?: number
          estado_pago?: string
          estatus?: string
          fecha?: string
          folio?: string
          forma_pago_inicial?: string | null
          hora?: string
          id?: string
          idempotency_key?: string
          monto_pagado?: number
          motivo_cancelacion?: string | null
          notas?: string | null
          saldo_pendiente?: number
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ajustar_stock: {
        Args: {
          p_business_id: string
          p_cantidad: number
          p_notas?: string
          p_producto_id: string
          p_tipo: string
          p_variante_id: string
        }
        Returns: number
      }
      cambiar_estatus_producto: {
        Args: {
          p_business_id: string
          p_estatus: string
          p_producto_id: string
        }
        Returns: undefined
      }
      cancelar_venta: {
        Args: { p_business_id: string; p_motivo: string; p_venta_id: string }
        Returns: undefined
      }
      crear_negocio: { Args: { p_nombre: string }; Returns: string }
      current_business_id: { Args: never; Returns: string }
      eliminar_pago_venta: {
        Args: { p_business_id: string; p_pago_id: string }
        Returns: undefined
      }
      guardar_producto: {
        Args: {
          p_business_id: string
          p_datos: Json
          p_producto_id: string
          p_variantes?: Json
        }
        Returns: string
      }
      is_business_admin: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      is_business_member: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      registrar_abono: {
        Args: {
          p_business_id: string
          p_forma_pago: string
          p_idempotency_key: string
          p_monto: number
          p_venta_id: string
        }
        Returns: Json
      }
      registrar_venta: {
        Args: {
          p_business_id: string
          p_cliente: Json
          p_idempotency_key: string
          p_lineas: Json
          p_notas: string
          p_pago: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

