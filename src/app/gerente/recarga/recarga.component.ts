import { AuthService } from '../../services/auth.service';
import { CommonModule, NgFor } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { supabase } from '../../services/supabaseClient';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { SidebarGerenteComponent } from '../shared-gerente/sidebar.component';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../services/shared.service';
import { filter } from 'rxjs/operators';
import { NgZone } from '@angular/core';

type SolicitacoesStatus = 'PENDENTE' | 'APROVADO' | 'REPROVADO';

interface Solicitacoes {
    id: number;
    usuario: string;
    usuarioID: string;
    filial: string;
    data: Date;
    tipo: string;
    valor: number;
    status: SolicitacoesStatus;
    observacoes: string;
    statusRH: SolicitacoesStatus;
}

@Component({
    selector: 'app-recarga-gerente',
    templateUrl: './recarga.component.html',
    styleUrls: ['./recarga.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        NgFor,
        CommonModule,
        SharedModule,
        SidebarGerenteComponent
    ]
})
export class RecargaComponent {
    filialId: string | null | undefined = undefined;
    colaboradorId: string | null | undefined = undefined;
    profiles: any[] = [];
    filiais: any[] = [];
    tooltipOpenId: string | null = null;
    periodoSelecionado: string | null | undefined = undefined;
    dataInicio?: Date;
    dataFim?: Date;
    trimestreSelecionado: null | undefined;
    semestreSelecionado: null | undefined;
    mesSelecionado: null | undefined;
    modalAberto = false;
    valorEditado: number = 0;
    solicitacaoSelecionada: Solicitacoes | null = null;
    mensagem: string = '';
    estadoMensagem: '' | 'loading' | 'sucesso' | 'erro' = '';

    solicitacoesPendentes: Solicitacoes[] = [];
    solicitacoesAprovados: Solicitacoes[] = [];
    solicitacoesReprovados: Solicitacoes[] = [];
    solicitacoes: any[] = [];

    constructor(
        private sharedService: SharedService,
        private auth: AuthService,
        private router: Router,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef) {
    }

    async ngOnInit() {
        this.filialId = this.auth.getFilialId();
        await this.carregarDados();
        await this.carregarUsuarios();
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.carregarDados();
            });
    }

    onColaboradorChange() {
        console.log('Usuário selecionado:', this.colaboradorId);
        this.carregarDados();
    }
    async carregarUsuarios() {
        this.profiles = await this.sharedService.carregarProfiles(
            this.filialId
        );
        this.ngZone.run(() => {
            this.profiles = this.profiles;
        });
    }
    async aplicarFiltros() {
        const { startDate, endDate } = this.sharedService.calcularPeriodo(
            this.periodoSelecionado,
            this.dataInicio,
            this.dataFim,
            this.mesSelecionado,
            this.trimestreSelecionado,
            this.semestreSelecionado,
        );
        this.carregarDados(startDate, endDate);
        this.separarListas();
    }

    async carregarDados(startDate?: Date, endDate?: Date) {
        const filtro = this.filialId;
        let query = supabase
            .from('recarga')
            .select(`id, 
                profile_id, 
                tipo_recarga, 
                status, 
                valor, 
                data_solicitacao, 
                observacoes, 
                status_final, 
                usuario:profiles!solicitacao_profile_id_fkey ( name ),
                filiais (nome)`);

        if (filtro) {
            query = query.eq('filial_id', filtro);
        }
        if (this.colaboradorId) {
            query = query.eq('profile_id', this.colaboradorId);
        }
        if (startDate) {
            query = query.gte('data_solicitacao', new Date(startDate).toISOString().split('T')[0]);
        }
        if (endDate) {
            query = query.lte('data_solicitacao', new Date(endDate).toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar solicitacoes:', error.message);
            return;
        }

        this.solicitacoes = (data || []).map((s: any) => {

            return {
                id: s.id,
                usuarioID: s.profile_id,
                usuario: s.usuario?.name ?? '-',
                filial: s.filiais?.nome,
                tipo: s.tipo_recarga,
                status: s.status,
                valor: s.valor,
                data: s.data_solicitacao,
                observacoes: s.observacoes,
                statusRH: s.status_final,
            };
        });
        this.ngZone.run(() => {
            this.solicitacoes = this.solicitacoes;
            this.separarListas();
        });
    }
    separarListas() {
        this.solicitacoesPendentes = this.solicitacoes.filter(s => s.status === 'PENDENTE');
        this.solicitacoesAprovados = this.solicitacoes.filter(s => s.status === 'APROVADO');
        this.solicitacoesReprovados = this.solicitacoes.filter(s => s.status === 'DESCONTADO');
    }

    async atualizarStatusRecarga(solicitacoes: Solicitacoes, novoStatus: SolicitacoesStatus) {
        const { data, error } = await supabase
            .from('recarga')
            .update({ status: novoStatus, aprovado_por: this.auth.getUserId() })
            .eq('id', Number(solicitacoes.id))
            .select('*')
            .maybeSingle();

        if (error) {
            console.error(`Erro ao atualizar solicitacao #${solicitacoes.id}:`, error.message);
            this.mostrarMensagem('Erro ao atualizar solicitacao:', 'erro');
            return;
        }
        if (!data) {
            console.warn(`Nenhuma solicitacao encontrado ou permitido para atualização: #${solicitacoes.id}`);
            return;
        }

        this.solicitacoesPendentes = this.solicitacoesPendentes.filter(s => s.id !== solicitacoes.id);
        this.solicitacoesAprovados = this.solicitacoesAprovados.filter(s => s.id !== solicitacoes.id);
        this.solicitacoesReprovados = this.solicitacoesReprovados.filter(s => s.id !== solicitacoes.id);

        solicitacoes.status = novoStatus;
        if (novoStatus === 'APROVADO') this.solicitacoesAprovados.push(solicitacoes);
        else if (novoStatus === 'REPROVADO') this.solicitacoesReprovados.push(solicitacoes);
        else this.solicitacoesPendentes.push(solicitacoes);
    }

    async salvarEdicao() {
        if (!this.solicitacaoSelecionada) return;

        this.estadoMensagem = 'loading';
        this.mensagem = 'Atualizando valor...';

        try {
            const { data, error } = await supabase
                .from('recarga')
                .update({ valor: this.valorEditado })
                .eq('id', this.solicitacaoSelecionada.id)
                .select('*')
                .maybeSingle();

            if (error) {
                console.error('Erro ao editar valor:', error.message);
                this.mostrarMensagem('Erro ao editar valor!', 'erro');
                this.fecharModal();
                return;
            }

            if (data) {
                this.solicitacaoSelecionada.valor = this.valorEditado;
                this.estadoMensagem = '';
                this.mensagem = '';
                this.cdr.detectChanges();
                this.mostrarMensagem('Valor atualizado com sucesso!', 'sucesso');
                this.fecharModal();
            }
        } catch (error) {
            console.error('Erro ao editar valor:', error);
            this.mostrarMensagem('Erro ao editar valor!', 'erro');
            this.fecharModal();
        } finally {
            this.cdr.detectChanges();
        }
    }

    isTooltipOpen(id: number | string): boolean {
        return this.tooltipOpenId === String(id);
    }

    toggleTooltip(id: number | string) {
        const key = String(id);
        this.tooltipOpenId = this.tooltipOpenId === key ? null : key;
    }

    @HostListener('document:click')
    closeTooltip() {
        this.tooltipOpenId = null;
    }
    exportarExcelRecargas() {
        console.log('Exportando solicitacoes:', this.solicitacoes);
        this.sharedService.exportarExcelRecargas(this.solicitacoes, 'solicitacoes.xlsx')
    }
    abrirModalEditar(solicitacao: Solicitacoes) {
        this.solicitacaoSelecionada = solicitacao;
        this.valorEditado = solicitacao.valor;
        this.modalAberto = true;
    }

    fecharModal() {
        this.modalAberto = false;
        this.solicitacaoSelecionada = null;
    }
    mostrarMensagem(texto: string, tipo: 'sucesso' | 'erro') {
        this.mensagem = texto;
        this.estadoMensagem = tipo;

        setTimeout(() => {
            this.estadoMensagem = '';
            this.mensagem = '';
            this.cdr.detectChanges();
        }, 3000);
    }
}