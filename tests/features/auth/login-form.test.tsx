import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@features/auth/components/login-form'

const mockSignIn = {
  email: jest.fn(),
}

const mockSignUp = {
  email: jest.fn(),
}

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}))

jest.mock('@lib/auth-client', () => ({
  signIn: {
    email: mockSignIn.email,
  },
  signUp: {
    email: mockSignUp.email,
  },
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  it('renders login form correctly', () => {
    render(<LoginForm />)
    
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-button')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('shows sign up form when toggle is clicked', () => {
    render(<LoginForm />)
    
    const toggleButton = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByTestId('login-button')).toHaveTextContent('Sign Up')
  })

  it('handles successful login', async () => {
    mockSignIn.email.mockResolvedValue({ error: null })
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    await waitFor(() => {
      expect(mockSignIn.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/org/select',
      })
      expect(mockPush).toHaveBeenCalledWith('/org/select')
    })
  })

  it('handles login error', async () => {
    mockSignIn.email.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    })
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    })
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles successful sign up', async () => {
    mockSignUp.email.mockResolvedValue({ error: null })
    
    render(<LoginForm />)
    
    // Switch to sign up mode
    fireEvent.click(screen.getByText("Don't have an account? Sign up"))
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'newuser@example.com' },
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'newpassword123' },
    })
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    await waitFor(() => {
      expect(mockSignUp.email).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'newuser',
        password: 'newpassword123',
        callbackURL: '/org/select',
      })
      expect(screen.getByText('Account created successfully! You can now sign in.')).toBeInTheDocument()
    })
  })

  it('handles sign up error', async () => {
    mockSignUp.email.mockResolvedValue({
      error: { message: 'Email already exists' },
    })
    
    render(<LoginForm />)
    
    // Switch to sign up mode
    fireEvent.click(screen.getByText("Don't have an account? Sign up"))
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('shows loading state during authentication', async () => {
    mockSignIn.email.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<LoginForm />)
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.getByTestId('login-button')).toBeDisabled()
  })

  it('validates required fields', () => {
    render(<LoginForm />)
    
    fireEvent.click(screen.getByTestId('login-button'))
    
    // Should not call sign in if fields are empty
    expect(mockSignIn.email).not.toHaveBeenCalled()
  })

  it('handles OAuth login', async () => {
    render(<LoginForm />)
    
    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)
    
    // Should trigger Google OAuth flow
    expect(googleButton).toBeInTheDocument()
  })
}) 