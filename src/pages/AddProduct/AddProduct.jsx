import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { categories, sizes, conditions } from '../../data/categories';
import { addProduct } from '../../services/productService';

import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';

import styles from './AddProduct.module.css';

const initialForm = {
  name: '',
  category: '',
  size: '',
  condition: '',
  price: '',
  originalPrice: '',
  brand: '',
  description: '',
  photo: null,
};

export default function AddProduct() {
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  if (!user) {
    return (
      <Navigate
        to="/login?redirect=/adicionar-produto"
        replace
      />
    );
  }

  function validate() {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = 'Nome obrigatório';
    }

    if (!form.category) {
      errs.category = 'Categoria obrigatória';
    }

    if (!form.size) {
      errs.size = 'Tamanho obrigatório';
    }

    if (!form.condition) {
      errs.condition = 'Condição obrigatória';
    }

    if (!form.price) {
      errs.price = 'Preço obrigatório';
    } else if (
      Number.isNaN(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      errs.price = 'Preço inválido';
    }

    if (!form.description.trim()) {
      errs.description = 'Descrição obrigatória';
    }

    return errs;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({
        ...current,
        photo: 'Selecione um arquivo de imagem válido.',
      }));
      return;
    }

    setErrors((current) => ({
      ...current,
      photo: '',
    }));

    setForm((current) => ({
      ...current,
      photo: file,
    }));

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSuccess(false);
      return;
    }

    setErrors({});
    setLoading(true);
    setSuccess(false);

    try {
      /*
       * Como estamos trabalhando com armazenamento local,
       * a foto é convertida para uma URL de dados.
       */
      let photoData = '';

      if (form.photo) {
        photoData = await readFileAsDataUrl(form.photo);
      }

      const categoryData = categories.find(
        (category) => category.id === form.category
      );

      const conditionData = conditions.find(
        (condition) => condition.id === form.condition
      );

      const product = {
        name: form.name.trim(),
        category: form.category,
        categoryName: categoryData?.name || form.category,
        size: form.size,
        condition: form.condition,
        conditionLabel: conditionData?.label || form.condition,
        price: Number(form.price),
        originalPrice: form.originalPrice
          ? Number(form.originalPrice)
          : null,
        brand: form.brand.trim(),
        description: form.description.trim(),
        photo: photoData,
        supplierId: user.supplierId || null,
        supplierName: user.name || 'Administradora',
        createdBy: user.id,
      };

      await addProduct(product);

      setSuccess(true);
      setForm(initialForm);
      setPreviewUrl('');
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);

      setErrors({
        submit: 'Não foi possível cadastrar a peça. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <h1 className={styles.title}>
          Vender minha peça
        </h1>

        <p className={styles.subtitle}>
          Preencha as informações da peça que deseja vender
        </p>

        {success && (
          <div className={styles.successBanner}>
            <span>
              ✅ Peça cadastrada com sucesso!
              Ela foi salva no sistema.
            </span>

            <button
              type="button"
              onClick={() => setSuccess(false)}
              className={styles.dismissBtn}
              aria-label="Fechar mensagem"
            >
              ✕
            </button>
          </div>
        )}

        {errors.submit && (
          <div className={styles.successBanner}>
            ⚠️ {errors.submit}
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >

          {/* FOTO */}
          <div className={styles.photoSection}>
            <label
              className={styles.photoLabel}
              htmlFor="photo"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização da peça"
                  className={styles.photoPreview}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoIcon}>
                    📷
                  </span>

                  <span>
                    Clique para adicionar foto
                  </span>
                </div>
              )}
            </label>

            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handleFile}
              className={styles.fileInput}
            />

            {errors.photo && (
              <p className={styles.fieldError}>
                {errors.photo}
              </p>
            )}
          </div>


          {/* NOME + CATEGORIA */}
          <div className={styles.grid2}>

            <Input
              label="Nome da peça"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Ex: Vestido Floral Azul"
            />

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="category"
              >
                Categoria
              </label>

              <select
                id="category"
                name="category"
                className={[
                  styles.select,
                  errors.category
                    ? styles.selectError
                    : '',
                ].join(' ')}
                value={form.category}
                onChange={handleChange}
              >
                <option value="">
                  Selecionar...
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p className={styles.fieldError}>
                  {errors.category}
                </p>
              )}
            </div>

          </div>


          {/* TAMANHO + CONDIÇÃO */}
          <div className={styles.grid2}>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="size"
              >
                Tamanho
              </label>

              <select
                id="size"
                name="size"
                className={[
                  styles.select,
                  errors.size
                    ? styles.selectError
                    : '',
                ].join(' ')}
                value={form.size}
                onChange={handleChange}
              >
                <option value="">
                  Selecionar...
                </option>

                {sizes.map((size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size}
                  </option>
                ))}
              </select>

              {errors.size && (
                <p className={styles.fieldError}>
                  {errors.size}
                </p>
              )}
            </div>


            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="condition"
              >
                Condição
              </label>

              <select
                id="condition"
                name="condition"
                className={[
                  styles.select,
                  errors.condition
                    ? styles.selectError
                    : '',
                ].join(' ')}
                value={form.condition}
                onChange={handleChange}
              >
                <option value="">
                  Selecionar...
                </option>

                {conditions.map((condition) => (
                  <option
                    key={condition.id}
                    value={condition.id}
                  >
                    {condition.label}
                  </option>
                ))}
              </select>

              {errors.condition && (
                <p className={styles.fieldError}>
                  {errors.condition}
                </p>
              )}
            </div>

          </div>


          {/* PREÇOS */}
          <div className={styles.grid2}>

            <Input
              label="Preço de venda (R$)"
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="Ex: 89.90"
            />

            <Input
              label="Preço original (R$) — opcional"
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={handleChange}
              placeholder="Ex: 250.00"
            />

          </div>


          {/* MARCA */}
          <Input
            label="Marca"
            id="brand"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Ex: Zara, Farm, Levi's..."
          />


          {/* DESCRIÇÃO */}
          <div className={styles.field}>

            <label
              className={styles.label}
              htmlFor="description"
            >
              Descrição
            </label>

            <textarea
              id="description"
              name="description"
              className={[
                styles.textarea,
                errors.description
                  ? styles.selectError
                  : '',
              ].join(' ')}
              value={form.description}
              onChange={handleChange}
              placeholder="Descreva a peça: tecido, estado, detalhes especiais..."
              rows={4}
            />

            {errors.description && (
              <p className={styles.fieldError}>
                {errors.description}
              </p>
            )}

          </div>


          {/* BOTÃO */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className={styles.submitBtn}
          >
            Publicar peça
          </Button>

        </form>

      </div>
    </div>
  );
}


/*
 * Converte uma imagem selecionada pelo usuário
 * para uma string que pode ser salva no localStorage.
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Não foi possível ler a imagem.'));
    };

    reader.readAsDataURL(file);
  });
}