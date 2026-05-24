import { Button, Card, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { LoginPayload } from '../services/auth.service';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginPayload) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      const token = response.data.accessToken;
      if (!token) {
        throw new Error('Brak tokenu w odpowiedzi');
      }

      localStorage.setItem('token', token);
      message.success("Pomyślnie zalogowano");
      navigate('/');
    } catch (error) {
      message.error("Błąd logowania. Sprawdź dane i spróbuj ponownie.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 380, borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>
            Zaloguj się
          </Title>
        </div>

        <Form
          name='login'
          layout='vertical'
          onFinish={onFinish}
          initialValues={{ email: '', password: '' }}
        >
          <Form.Item
            label='Email'
            name='email'
            rules={[
              { required: true, message: 'Wpisz swój email' },
              { type: 'email', message: 'Wprowad poprawny adres email' },
            ]}
          >
            <Input placeholder='example@mail.com' />
          </Form.Item>

          <Form.Item
            label='Hasło'
            name='password'
            rules={[{ required: true, message: 'Wpisz swoje hasło' }]}
          >
            <Input.Password placeholder='Hasło' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block loading={loading}>
              Zaloguj
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
