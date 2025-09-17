# app/forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, SelectField, DateTimeField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional

class RegisterForm(FlaskForm):
    nombre = StringField("Nombre", validators=[DataRequired(), Length(max=50)])
    apellido = StringField("Apellido", validators=[DataRequired(), Length(max=50)])
    email = StringField("Email", validators=[DataRequired(), Email(), Length(max=100)])
    contraseña = PasswordField("Contraseña", validators=[DataRequired(), Length(min=6)])
    confirmar = PasswordField("Confirmar contraseña", validators=[DataRequired(), EqualTo("contraseña")])
    submit = SubmitField("Registrarse")

class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    contraseña = PasswordField("Contraseña", validators=[DataRequired()])
    submit = SubmitField("Ingresar")

class CategoriaForm(FlaskForm):
    nombre = StringField("Nombre", validators=[DataRequired()])
    descripcion = TextAreaField("Descripción", validators=[Optional()])
    submit = SubmitField("Guardar")

class TareaForm(FlaskForm):
    titulo = StringField("Título", validators=[DataRequired()])
    descripcion = TextAreaField("Descripción", validators=[Optional()])
    fecha_vencimiento = DateTimeField("Fecha de vencimiento", format="%Y-%m-%d %H:%M", validators=[Optional()])
    prioridad = SelectField("Prioridad", choices=[("Alta","Alta"),("Media","Media"),("Baja","Baja")], validators=[Optional()])
    estado = SelectField("Estado", choices=[("Pendiente","Pendiente"),("Completada","Completada")], validators=[Optional()])
    categoria = SelectField("Categoría", coerce=int, validators=[Optional()])
    submit = SubmitField("Guardar")
