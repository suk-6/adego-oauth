import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { OAuthTokenDTO } from 'src/dto';
import { AuthType, KakaoUserModel } from 'src/model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class KakaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
    ) {}

    async login(dto: OAuthTokenDTO) {
        const kakaoUser = await this.getKakaoUser(dto.access_token);
        const id = `kakao_${kakaoUser.id}`;

        const user = await this.prisma.findUserById(id);

        if (!user) {
            await this.prisma.userCreate({
                id,
                provider: AuthType.kakao,
                providerId: kakaoUser.id.toString(),
                email: null,
                name: null,
            });
        }

        return this.authService.createTokens(id);
    }

    async getKakaoUser(access_token: string) {
        const user: KakaoUserModel = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => (res.status === 200 ? res.json() : null));

        if (!user) {
            throw new UnauthorizedException('A02'); // A02 - 카카오 사용자 정보 조회 실패
        }

        return user;
    }
}
