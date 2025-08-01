import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type UserRole = 'admin' | 'editor' | 'user';

interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const validateRole = (role: any): UserRole =>
  ['admin', 'editor', 'user'].includes(role) ? (role as UserRole) : 'user';

export const registerUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string; role: UserRole },
  { rejectValue: string }
>(
  'auth/register',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { uid, email: userEmail } = userCredential.user;

      await firestore().collection('users').doc(uid).set({
        email: userEmail,
        role,
      });

      return { uid, email: userEmail, role };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const { uid, email: userEmail } = userCredential.user;

      const userDoc = await firestore().collection('users').doc(uid).get();
      const userData = userDoc.data();
      const role = validateRole(userData?.role);

      return { uid, email: userEmail, role };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await auth().signOut();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const checkAuthState = createAsyncThunk<AuthUser | null, void, { rejectValue: string }>(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    return new Promise<AuthUser | null>((resolve) => {
      const unsubscribe = auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        if (user) {
          try {
            const doc = await firestore().collection('users').doc(user.uid).get();
            const data = doc.data();
            const role = validateRole(data?.role);
            resolve({ uid: user.uid, email: user.email, role });
          } catch (e) {
            console.error('Failed to fetch user document:', e);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload ?? 'Registration failed';
        state.loading = false;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload ?? 'Login failed';
        state.loading = false;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload ?? 'Logout failed';
      })

      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.error = action.payload ?? 'Auth check failed';
        state.loading = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
