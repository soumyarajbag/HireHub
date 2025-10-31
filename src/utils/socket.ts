import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { JwtUtil } from './jwt';
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/models/user.entity';
import { SocketData, SocketEvent } from '@/types';
import { logger } from './logger';
import { config } from '@/config/environment';

const userRepository = new UserRepository(User);
const userService = new UserService(userRepository);

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.IO server initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = JwtUtil.verifyAccessToken(token);
        const user = await userService.findById(payload.userId);

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        if (user.tokenVersion !== payload.tokenVersion) {
          return next(new Error('Token has been invalidated'));
        }

        socket.data = {
          userId: user._id,
          userRole: user.role,
        } as SocketData;

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on(SocketEvent.CONNECTION, (socket) => {
      const userId = socket.data.userId;
      const userRole = socket.data.userRole;

      this.connectedUsers.set(socket.id, userId);
      logger.info(`User ${userId} connected with socket ${socket.id}`);

      socket.emit(SocketEvent.CONNECTION, {
        message: 'Connected successfully',
        userId,
        userRole,
      });

      socket.on(SocketEvent.JOIN_ROOM, (room: string) => {
        socket.join(room);
        logger.info(`User ${userId} joined room ${room}`);
        socket.emit(SocketEvent.JOIN_ROOM, { room, message: `Joined room ${room}` });
      });

      socket.on(SocketEvent.LEAVE_ROOM, (room: string) => {
        socket.leave(room);
        logger.info(`User ${userId} left room ${room}`);
        socket.emit(SocketEvent.LEAVE_ROOM, { room, message: `Left room ${room}` });
      });

      socket.on(SocketEvent.MESSAGE, (data: any) => {
        logger.info(`Message from user ${userId}:`, data);
        socket.emit(SocketEvent.MESSAGE, {
          ...data,
          timestamp: new Date().toISOString(),
          from: userId,
        });
      });

      socket.on(SocketEvent.DISCONNECT, (reason) => {
        this.connectedUsers.delete(socket.id);
        logger.info(`User ${userId} disconnected. Reason: ${reason}`);
      });

      socket.on(SocketEvent.ERROR, (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      targetUser: userId,
      timestamp: new Date().toISOString(),
    });
  }

  public emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(room).emit(event, {
      ...data,
      room,
      timestamp: new Date().toISOString(),
    });
  }

  public emitToAll(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, SocketEvent.NOTIFICATION, notification);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserSocketCount(userId: string): number {
    let count = 0;
    this.connectedUsers.forEach((uid) => {
      if (uid === userId) count++;
    });
    return count;
  }

  public disconnectUser(userId: string): void {
    if (!this.io) return;

    this.connectedUsers.forEach((uid, socketId) => {
      if (uid === userId) {
        const socket = this.io!.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    });
  }

  public getServer(): SocketIOServer | null {
    return this.io;
  }
}
