import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { categories, sizes, conditions } from '../../data/categories';
import { suppliers } from '../../data/suppliers';
import { addProduct } from '../../data/productService.js';
import { USER_ROLES } from '../../data/roles.js';

import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';

import styles from './AddProduct.module.css';

const initialForm = {
  name: '',
  description: '',
  category: '',
  size: '',
  brand: '',
  condition: '',
  price: '',
  originalPrice: '',
  tags: '',
  supplierId: '',
  available: true,
};

function getOptionValue(option) {
  if (typeof option === 'string') return option;
  return option?.value ?? option?.id ?? '';
}

function getOptionLabel(option) {
  if (typeof option === 'string') return option;
  return option?.label ?? option?.name ?? option?.value ?? '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error('Não foi possível ler a imagem.'));

    reader.readAsDataURL(file);
  });
}

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.status === 'active'),
    []
  );

  const isAdmin = user?.role === USER_ROLES.ADMIN;

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.card}>
            <h1>Acesso administrativo não autorizado.</h1>
          </div>
        </section>
      </main>
    );
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setError('');
    setSuccess('');
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem válido.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setImageFile(file);
      setImagePreview(dataUrl);
      setError('');
    } catch {
      setError('Não foi possível carregar a imagem.');
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Digite o nome da peça.';
    }

    if (!form.category) {
      return 'Selecione uma categoria.';
    }

    if (!form.size) {
      return 'Selecione o tamanho.';
    }

    if (!form.condition) {
      return 'Selecione o estado da peça.';
    }

    if (!form.price || Number(form.price) < 0) {
      return 'Digite um preço válido.';
    }

    if (
      form.originalPrice &&
      Number(form.originalPrice) < Number(form.price)
    ) {
      return 'O preço original não pode ser menor que o preço da peça.';
    }

    if (!form.supplierId) {
      return 'Selecione a fornecedora da peça.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const supplier = activeSuppliers.find(
      (item) => item.id === form.supplierId
    );

    if (!supplier) {
      setError('A fornecedora selecionada não foi encontrada.');
      return;
    }

    setLoading(true);

    try {
      const categoryObject = categories.find(
        (item) => getOptionValue(item) === form.category
      );

      const conditionObject = conditions.find(
        (item) => getOptionValue(item) === form.condition
      );

      const tags = form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const product = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        categoryName:
          getOptionLabel(categoryObject) || form.category,
        size: form.size,
        brand: form.brand.trim(),
        condition: form.condition,
        conditionLabel:
          getOptionLabel(conditionObject) || form.condition,
        price: Number(form.price),
        originalPrice: form.originalPrice
          ? Number(form.originalPrice)
          : null,
        tags,
        photo: imagePreview || null,
        images: imagePreview ? [imagePreview] : [],
        supplierId: supplier.id,
        supplierName: supplier.name,
        createdBy:
          user?.email || user?.name || 'Administradora',
        createdByRole: USER_ROLES.ADMIN,
        available: Boolean(form.available),
        status: form.available
          ? 'disponivel'
          : 'indisponivel',
        createdAt: new Date().toISOString(),
      };

      await addProduct(product);

      setSuccess('Peça cadastrada com sucesso!');

      setForm(initialForm);
      setImageFile(null);
      setImagePreview('');

      const imageInput =
        document.getElementById('product-image');

      if (imageInput) {
        imageInput.value = '';
      }
    } catch (submitError) {
      console.error(
        'Erro ao cadastrar peça:',
        submitError
      );

      setError(
        submitError?.message ||
          'Não foi possível cadastrar a peça. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    navigate('/admin/produtos');
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Cadastrar peça</h1>

            <p>
              Cadastre uma peça para o catálogo e vincule-a à
              sua fornecedora.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Voltar
          </Button>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success} role="status">
            {success}
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <section className={styles.card}>
            <h2>Informações da peça</h2>

            <div className={styles.grid}>
              <div className={styles.fullWidth}>
                <Input
                  label="Nome da peça"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex.: Vestido floral vintage"
                  required
                />
              </div>

              <div className={styles.fullWidth}>
                <label
                  className={styles.label}
                  htmlFor="description"
                >
                  Descrição
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descreva a peça, detalhes, medidas, conservação..."
                  rows={5}
                  className={styles.textarea}
                />
              </div>

              <div>
                <label
                  className={styles.label}
                  htmlFor="category"
                >
                  Categoria *
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecione</option>

                  {categories.map((category) => {
                    const value = getOptionValue(category);
                    const label = getOptionLabel(category);

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  className={styles.label}
                  htmlFor="size"
                >
                  Tamanho *
                </label>

                <select
                  id="size"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecione</option>

                  {sizes.map((size) => {
                    const value = getOptionValue(size);
                    const label = getOptionLabel(size);

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  className={styles.label}
                  htmlFor="condition"
                >
                  Estado da peça *
                </label>

                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecione</option>

                  {conditions.map((condition) => {
                    const value = getOptionValue(condition);
                    const label = getOptionLabel(condition);

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <Input
                  label="Marca"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Ex.: Zara"
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Valores</h2>

            <div className={styles.grid}>
              <div>
                <Input
                  label="Preço de venda (R$)"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <Input
                  label="Preço original (R$)"
                  name="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>

              <div className={styles.fullWidth}>
                <Input
                  label="Tags"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="Ex.: vintage, floral, verão"
                />

                <small className={styles.help}>
                  Separe as tags por vírgulas.
                </small>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Fornecedora</h2>

            <div>
              <label
                className={styles.label}
                htmlFor="supplierId"
              >
                Fornecedora da peça *
              </label>

              <select
                id="supplierId"
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="">
                  Selecione uma fornecedora
                </option>

                {activeSuppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {form.supplierId && (
              <p className={styles.supplierInfo}>
                Esta peça ficará vinculada à fornecedora
                selecionada.
              </p>
            )}
          </section>

          <section className={styles.card}>
            <h2>Imagem</h2>

            <label
              className={styles.label}
              htmlFor="product-image"
            >
              Foto da peça
            </label>

            <input
              id="product-image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />

            <small className={styles.help}>
              Formatos de imagem aceitos. Tamanho máximo: 5 MB.
            </small>

            {imagePreview && (
              <div className={styles.preview}>
                <img
                  src={imagePreview}
                  alt="Pré-visualização da peça"
                  className={styles.previewImage}
                />

                {imageFile && (
                  <span className={styles.fileName}>
                    {imageFile.name}
                  </span>
                )}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2>Disponibilidade</h2>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
              />

              <span>Peça disponível para venda</span>
            </label>
          </section>

          <div className={styles.actions}>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className={styles.secondaryButton}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar peça'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}